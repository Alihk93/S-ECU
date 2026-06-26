/* =============================================================================
 *  S-ECU  ::  Smart ECU Tester
 *  ESP32-S3 firmware backend  —  ESP-IDF v5.5.x
 *
 *  Pipeline:  1x potentiometer (throttle/load) + 3x push-buttons
 *      -> FreeRTOS input task (ADC oneshot + boxcar averaging, debounced GPIO ISR)
 *      -> ECU signal model (rpm rev model + analog/voltage/IAC/status channels)
 *      -> length-1 state queue (xQueueOverwrite => lock-free "always latest")
 *      -> telemetry task (30 Hz, change-detected minified JSON, see protocol.ts)
 *      -> WebSocket broadcast to ALL connected SoftAP clients
 *
 *  ASSUMPTION: only the throttle pot is a physical input (it drives LOAD). rpm and
 *  every analog/digital channel are MODELLED here (see model_status + input_task),
 *  mirroring dashboard-ui/src/lib/sim.ts so the live stream matches the browser sim.
 *  To drive any channel from real hardware, add an ADC1 channel / GPIO and replace
 *  that one assignment.  NOTE: ADC1 only — ADC2 is unusable while Wi-Fi is active.
 *  CKP/CMP waveforms and 8 coil/injector firings are derived browser-side from rpm
 *  (+ cam mode cm/cp); they are intentionally NOT streamed.
 * ============================================================================= */

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <math.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "esp_event.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"

/* ------------------------------ USER CONFIG ------------------------------- */
#define WIFI_SSID            "S-ECU"
#define WIFI_PASS            "0000"            /* WPA2 needs >= 8 chars; anything shorter -> OPEN AP */
#define AP_IP_ADDR           "10.10.10.10"
#define WIFI_CHANNEL         1
#define MAX_CLIENTS          10                /* must match httpd max_open_sockets */

#define POT_ADC_UNIT         ADC_UNIT_1        /* ADC1 ONLY — ADC2 dies with Wi-Fi  */
#define POT_ADC_CHANNEL      ADC_CHANNEL_3     /* GPIO4 on ESP32-S3                  */
#define ADC_AVG_SAMPLES      16                /* boxcar depth, kills needle jitter  */

#define BTN_IGNITION_GPIO    5
#define BTN_HEADLIGHTS_GPIO  6
#define BTN_CHECKENG_GPIO    7
#define DEBOUNCE_US          50000             /* 50 ms */

#define LOAD_MAX_PCT         100               /* pot maps to 0..100 % throttle/load */
#define INPUT_PERIOD_MS      20                /* 50 Hz sensor loop */
#define TELEMETRY_HZ         30
#define TX_HEARTBEAT_US      500000            /* force a frame at least every 0.5 s */

#define RPM_IDLE             800
#define RPM_MAX              6200

static const char *TAG = "S-ECU";

/* ---------------------------- SHARED STATE TYPE --------------------------- */
/* Wire contract — see dashboard-ui/src/lib/protocol.ts (THE source of truth).
 * The 12-bit status mask bit order MUST match STATUS_BIT_ORDER there:
 *  0 battery  1 switch  2 start  3 etc  4 fan1  5 fan2
 *  6 fuelPump 7 immoP   8 immoN  9 mrcP 10 mrcN 11 iac                          */
typedef struct {
    int rpm;         /* 0..7500            */
    int load;        /* 0..100  %          */
    int maf;         /* 0..400  g/s        */
    int map;         /* 0..250  kPa        */
    int iat;         /* deg C (may be < 0) */
    int ev;          /* ECU volts  * 100   */
    int sv;          /* sensor Vref * 100  */
    int iac;         /* 0..200 stepper     */
    int st;          /* 12-bit status mask */
    int cm;          /* cam mode 0/1/2     */
    int cp;          /* cam phase deg      */
} dash_state_t;

/* status mask bit positions (index == bit) */
enum {
    ST_BATTERY = 0, ST_SWITCH, ST_START, ST_ETC, ST_FAN1, ST_FAN2,
    ST_FUELPUMP, ST_IMMOP, ST_IMMON, ST_MRCP, ST_MRCN, ST_IAC,
};

static QueueHandle_t  s_state_q = NULL;  /* length-1, xQueueOverwrite snapshot */
static QueueHandle_t  s_btn_q   = NULL;  /* button index posted from ISR        */
static httpd_handle_t s_server  = NULL;
static adc_oneshot_unit_handle_t s_adc = NULL;

/* button-toggled latches (owned exclusively by input_task) */
static bool s_ignition   = false;
static bool s_headlights = false;
static bool s_check_eng  = false;

/* -------------------------------- BUTTONS --------------------------------- */
static const gpio_num_t s_btn_gpio[] = {
    BTN_IGNITION_GPIO, BTN_HEADLIGHTS_GPIO, BTN_CHECKENG_GPIO,
};
#define NUM_BTN (sizeof(s_btn_gpio) / sizeof(s_btn_gpio[0]))

static void IRAM_ATTR button_isr(void *arg)
{
    uint32_t idx = (uint32_t)arg;
    BaseType_t hp = pdFALSE;
    xQueueSendFromISR(s_btn_q, &idx, &hp);     /* ISR only timestamps the event */
    if (hp) portYIELD_FROM_ISR();
}

static void buttons_init(void)
{
    gpio_config_t io = {
        .mode         = GPIO_MODE_INPUT,
        .pull_up_en   = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_NEGEDGE,     /* active-low button to GND */
        .pin_bit_mask = 0,
    };
    for (int i = 0; i < NUM_BTN; i++) io.pin_bit_mask |= (1ULL << s_btn_gpio[i]);
    ESP_ERROR_CHECK(gpio_config(&io));

    ESP_ERROR_CHECK(gpio_install_isr_service(0));
    for (uint32_t i = 0; i < NUM_BTN; i++)
        ESP_ERROR_CHECK(gpio_isr_handler_add(s_btn_gpio[i], button_isr, (void *)i));
}

/* ---------------------------------- ADC ----------------------------------- */
static void adc_init(void)
{
    adc_oneshot_unit_init_cfg_t unit_cfg = { .unit_id = POT_ADC_UNIT };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&unit_cfg, &s_adc));

    adc_oneshot_chan_cfg_t ch_cfg = {
        .atten    = ADC_ATTEN_DB_12,           /* ~0..3.1 V full-scale (v5.x enum) */
        .bitwidth = ADC_BITWIDTH_DEFAULT,      /* 12-bit on S3 -> 0..4095          */
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(s_adc, POT_ADC_CHANNEL, &ch_cfg));
}

/* burst-average a batch of raw samples -> smooths electrical noise w/o lag */
static int adc_read_load(void)
{
    int sum = 0, raw = 0;
    for (int i = 0; i < ADC_AVG_SAMPLES; i++)
        if (adc_oneshot_read(s_adc, POT_ADC_CHANNEL, &raw) == ESP_OK) sum += raw;
    int avg = sum / ADC_AVG_SAMPLES;                 /* 0..4095 */
    return (avg * LOAD_MAX_PCT) / 4095;              /* 0..100  */
}

/* ----------------------------- ECU SIGNAL MODEL --------------------------- */
/* The pot is the only real input: it drives LOAD. rpm and every analog/digital
 * channel are MODELLED here so the dashboard's full signal set has live data.
 * The math mirrors dashboard-ui/src/lib/sim.ts deriveAnalog() (sans noise) so the
 * on-device "live" stream matches the browser simulation. Swap any line for a real
 * adc_read on another ADC1 channel as hardware is wired in.                    */
static float f_rpm = 0.0f;
static float f_iac = 90.0f;

static inline float clampf(float v, float lo, float hi)
{
    return v < lo ? lo : (v > hi ? hi : v);
}

/* assemble the 12-bit digital status mask (bit order == protocol.ts) */
static int model_status(bool run, int rpm, float load01, int iat)
{
    int m = 0;
    if (run)                        m |= (1 << ST_SWITCH) | (1 << ST_BATTERY) |
                                         (1 << ST_FUELPUMP) | (1 << ST_IMMOP) | (1 << ST_IMMON);
    if (run && rpm > 0 && rpm < 600) m |= (1 << ST_START);
    if (load01 > 0.05f)              m |= (1 << ST_ETC);
    if (iat > 70)                    m |= (1 << ST_FAN1);
    if (iat > 84)                    m |= (1 << ST_FAN2);
    if (run && rpm > 1500)           m |= (1 << ST_MRCP);
    if (run && rpm > 3500)           m |= (1 << ST_MRCN);
    if (run && rpm < 1300)           m |= (1 << ST_IAC);
    return m;
}

/* ------------------------------ INPUT TASK -------------------------------- */
static void input_task(void *arg)
{
    int64_t last_press[NUM_BTN] = {0};
    const float dt = INPUT_PERIOD_MS / 1000.0f;

    while (1) {
        /* 1. debounced buttons (ISR queued raw events; we filter bounce here)
         *    ignition = run gate · headlights = cam ADVANCE · check-eng = cam FAULT */
        uint32_t b;
        while (xQueueReceive(s_btn_q, &b, 0) == pdTRUE) {
            int64_t now = esp_timer_get_time();
            if (now - last_press[b] < DEBOUNCE_US) continue;
            last_press[b] = now;
            switch (b) {
                case 0: s_ignition   = !s_ignition;   break;
                case 1: s_headlights = !s_headlights; break;
                case 2: s_check_eng  = !s_check_eng;  break;
            }
        }

        /* 2. throttle pot -> load (gated by ignition) -> rpm rev model */
        bool  run    = s_ignition;
        int   load   = run ? adc_read_load() : 0;            /* 0..100 % */
        float load01 = load / 100.0f;
        int   target = run ? (RPM_IDLE + (int)(load01 * (RPM_MAX - RPM_IDLE))) : 0;
        f_rpm += (target - f_rpm) * fminf(1.0f, dt * 3.0f);  /* first-order glide */
        if (f_rpm < 1.0f) f_rpm = 0.0f;
        int rpm = (int)(f_rpm + 0.5f);

        /* 3. derived analog channels (mirror dashboard sim.ts deriveAnalog) */
        float t    = esp_timer_get_time() / 1000000.0f;      /* seconds */
        float rpmN = clampf(rpm / 7000.0f, 0.0f, 1.0f);
        int   map  = (int)clampf(28 + load01 * 175 + rpmN * 15,            0, 250);
        int   maf  = (int)clampf(3 + rpmN * load01 * 360 + rpmN * 25,      0, 400);
        /* load coeff is deliberately aggressive so sustained high load crosses the
         * FAN1 (>70) / FAN2 (>84) thresholds — keeps both fan bits testable on the bench */
        int   iat  = (int)clampf(38 + 18 * sinf(t * 0.05f) + load01 * 70, -20, 120);
        float ecuV = clampf(13.8f - load01 * 0.5f + 0.2f * sinf(t * 0.7f), 0, 25);
        int   sv   = 500;                                    /* 5.00 V sensor Vref */

        /* 4. IAC stepper + cam mode */
        float iac_target = run ? (rpm < 1300 ? 150.0f : 40.0f) : 90.0f;
        f_iac += (iac_target - f_iac) * fminf(1.0f, dt * 1.5f);
        int cm = s_check_eng ? 2 : (s_headlights ? 1 : 0);   /* fault > advance > sync */

        /* 5. assemble snapshot */
        dash_state_t st = {
            .rpm  = rpm,
            .load = load,
            .maf  = maf,
            .map  = map,
            .iat  = iat,
            .ev   = (int)(ecuV * 100 + 0.5f),
            .sv   = sv,
            .iac  = (int)(f_iac + 0.5f),
            .st   = model_status(run, rpm, load01, iat),
            .cm   = cm,
            .cp   = 10,
        };

        xQueueOverwrite(s_state_q, &st);             /* latest-wins, no mutex */
        vTaskDelay(pdMS_TO_TICKS(INPUT_PERIOD_MS));
    }
}

/* ----------------------------- WS BROADCAST ------------------------------- */
typedef struct { char *json; size_t len; } ws_msg_t;

/* runs in httpd context via httpd_queue_work -> the only safe place to send */
static void ws_broadcast_work(void *arg)
{
    ws_msg_t *m = (ws_msg_t *)arg;
    size_t fds = MAX_CLIENTS;
    int client_fds[MAX_CLIENTS];

    if (httpd_get_client_list(s_server, &fds, client_fds) == ESP_OK) {
        httpd_ws_frame_t frame = {
            .type    = HTTPD_WS_TYPE_TEXT,
            .payload = (uint8_t *)m->json,
            .len     = m->len,
        };
        for (int i = 0; i < (int)fds; i++) {
            if (httpd_ws_get_fd_info(s_server, client_fds[i]) == HTTPD_WS_CLIENT_WEBSOCKET)
                httpd_ws_send_frame_async(s_server, client_fds[i], &frame);
        }
    }
    free(m->json);
    free(m);
}

static void broadcast_json(const char *json, size_t len)
{
    if (!s_server) return;
    ws_msg_t *m = malloc(sizeof(ws_msg_t));
    if (!m) return;
    m->json = malloc(len + 1);
    if (!m->json) { free(m); return; }
    memcpy(m->json, json, len + 1);
    m->len = len;
    if (httpd_queue_work(s_server, ws_broadcast_work, m) != ESP_OK) {
        free(m->json);
        free(m);
    }
}

/* ------------------------------ TELEMETRY --------------------------------- */
static void telemetry_task(void *arg)
{
    dash_state_t st, last;
    memset(&last, 0xFF, sizeof(last));               /* force first send */
    int64_t last_tx = 0;
    char buf[160];
    const TickType_t period = pdMS_TO_TICKS(1000 / TELEMETRY_HZ);

    while (1) {
        vTaskDelay(period);                          /* pace at TELEMETRY_HZ */
        if (xQueuePeek(s_state_q, &st, 0) != pdTRUE) continue;

        int64_t now = esp_timer_get_time();
        bool changed   = memcmp(&st, &last, sizeof(st)) != 0;
        bool heartbeat = (now - last_tx) > TX_HEARTBEAT_US;
        if (!changed && !heartbeat) continue;        /* idle => silent link  */

        /* wire frame — see dashboard-ui/src/lib/protocol.ts (byte-for-byte) */
        int len = snprintf(buf, sizeof(buf),
            "{\"rpm\":%d,\"ld\":%d,\"maf\":%d,\"map\":%d,\"iat\":%d,"
            "\"ev\":%d,\"sv\":%d,\"iac\":%d,\"st\":%d,\"cm\":%d,\"cp\":%d}",
            st.rpm, st.load, st.maf, st.map, st.iat,
            st.ev, st.sv, st.iac, st.st, st.cm, st.cp);

        broadcast_json(buf, len);
        last = st;
        last_tx = now;
    }
}

/* --------------------------- HTTP / WS SERVER ----------------------------- */
/* gzipped single-page UI embedded via EMBED_FILES "web/index.html.gz" */
extern const uint8_t index_start[] asm("_binary_index_html_gz_start");
extern const uint8_t index_end[]   asm("_binary_index_html_gz_end");

static esp_err_t root_get_handler(httpd_req_t *req)
{
    httpd_resp_set_type(req, "text/html");
    httpd_resp_set_hdr(req, "Content-Encoding", "gzip");  /* browser decompresses */
    return httpd_resp_send(req, (const char *)index_start, index_end - index_start);
}

/* display-only: finish handshake, drain & discard anything inbound */
static esp_err_t ws_handler(httpd_req_t *req)
{
    if (req->method == HTTP_GET) {
        ESP_LOGI(TAG, "WS client connected (fd=%d)", httpd_req_to_sockfd(req));
        return ESP_OK;                                /* handshake complete */
    }
    httpd_ws_frame_t ws = { .type = HTTPD_WS_TYPE_TEXT };
    httpd_ws_recv_frame(req, &ws, 0);                 /* probe length */
    if (ws.len) {
        uint8_t *p = calloc(1, ws.len + 1);
        if (p) { ws.payload = p; httpd_ws_recv_frame(req, &ws, ws.len); free(p); }
    }
    return ESP_OK;
}

static void server_start(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_open_sockets = MAX_CLIENTS;            /* needs CONFIG_LWIP_MAX_SOCKETS>=13 */
    config.lru_purge_enable = true;

    ESP_ERROR_CHECK(httpd_start(&s_server, &config));

    httpd_uri_t root = { .uri = "/",  .method = HTTP_GET, .handler = root_get_handler };
    httpd_register_uri_handler(s_server, &root);

    httpd_uri_t ws = {
        .uri = "/ws", .method = HTTP_GET,
        .handler = ws_handler, .is_websocket = true,
    };
    httpd_register_uri_handler(s_server, &ws);
}

/* -------------------------------- Wi-Fi AP -------------------------------- */
static void wifi_softap_init(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_t *ap_netif = esp_netif_create_default_wifi_ap();

    /* Static AP IP per spec: 10.10.10.10. Stop DHCP, set ip/gw/mask, restart DHCP. */
    esp_netif_ip_info_t ip_info;
    ip_info.ip.addr      = esp_ip4addr_aton(AP_IP_ADDR);
    ip_info.gw.addr      = esp_ip4addr_aton(AP_IP_ADDR);
    ip_info.netmask.addr = esp_ip4addr_aton("255.255.255.0");
    ESP_ERROR_CHECK(esp_netif_dhcps_stop(ap_netif));
    ESP_ERROR_CHECK(esp_netif_set_ip_info(ap_netif, &ip_info));
    ESP_ERROR_CHECK(esp_netif_dhcps_start(ap_netif));

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    wifi_config_t ap = {
        .ap = {
            .ssid           = WIFI_SSID,
            .ssid_len       = strlen(WIFI_SSID),
            .channel        = WIFI_CHANNEL,
            .password       = WIFI_PASS,
            .max_connection = 8,
            .authmode       = WIFI_AUTH_WPA2_PSK,
        },
    };
    /* WPA2-PSK requires an 8..63 char key; a shorter/empty pass forces an OPEN AP. */
    if (strlen(WIFI_PASS) < 8) ap.ap.authmode = WIFI_AUTH_OPEN;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "SoftAP up: SSID '%s' (%s)  ->  http://%s", WIFI_SSID,
             ap.ap.authmode == WIFI_AUTH_OPEN ? "open" : "wpa2", AP_IP_ADDR);
}

/* --------------------------------- MAIN ----------------------------------- */
void app_main(void)
{
    ESP_ERROR_CHECK(nvs_flash_init());

    s_state_q = xQueueCreate(1, sizeof(dash_state_t));   /* length-1 snapshot */
    s_btn_q   = xQueueCreate(16, sizeof(uint32_t));

    adc_init();
    buttons_init();
    wifi_softap_init();
    server_start();

    /* input on core 1 (away from Wi-Fi), telemetry on core 0 */
    xTaskCreatePinnedToCore(input_task,     "input", 4096, NULL, 6, NULL, 1);
    xTaskCreatePinnedToCore(telemetry_task, "telem", 4096, NULL, 5, NULL, 0);

    ESP_LOGI(TAG, "S-ECU backend running.");
}