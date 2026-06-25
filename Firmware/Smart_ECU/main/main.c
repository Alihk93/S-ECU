/* =============================================================================
 *  S-ECU  ::  Smart ECU Tester
 *  ESP32-S3 firmware backend  —  ESP-IDF v5.5.x
 *
 *  Pipeline:  1x potentiometer (throttle) + 3x push-buttons
 *      -> FreeRTOS input task (ADC oneshot + boxcar averaging, debounced GPIO ISR)
 *      -> derived gauge model (RPM / fuel / temp)
 *      -> length-1 state queue (xQueueOverwrite => lock-free "always latest")
 *      -> telemetry task (30 Hz, change-detected minified JSON)
 *      -> WebSocket broadcast to ALL connected SoftAP clients
 *
 *  ASSUMPTION: only the throttle is a physical input. RPM, fuel and temp are
 *  SIMULATED in firmware (see sim_rpm / sim_slow). To drive any of them from a
 *  real pot instead, add an ADC1 channel and replace that one assignment.
 *  NOTE: use ADC1 only — ADC2 is unusable while Wi-Fi is active.
 * ============================================================================= */

#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

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
#define WIFI_SSID            "S-ECU_Dashboard"
#define WIFI_PASS            "ecu12345"        /* >= 8 chars, or "" for an open AP */
#define WIFI_CHANNEL         1
#define MAX_CLIENTS          10                /* must match httpd max_open_sockets */

#define POT_ADC_UNIT         ADC_UNIT_1        /* ADC1 ONLY — ADC2 dies with Wi-Fi  */
#define POT_ADC_CHANNEL      ADC_CHANNEL_3     /* GPIO4 on ESP32-S3                  */
#define ADC_AVG_SAMPLES      16                /* boxcar depth, kills needle jitter  */

#define BTN_IGNITION_GPIO    5
#define BTN_HEADLIGHTS_GPIO  6
#define BTN_CHECKENG_GPIO    7
#define DEBOUNCE_US          50000             /* 50 ms */

#define SPEED_MAX_KMH        200
#define INPUT_PERIOD_MS      20                /* 50 Hz sensor loop */
#define TELEMETRY_HZ         30
#define TX_HEARTBEAT_US      500000            /* force a frame at least every 0.5 s */

#define AMBIENT_C            35.0f
#define HIGH_TEMP_C          110               /* high_temp warning icon threshold   */
#define LOW_FUEL_PCT         15                /* low_fuel warning icon threshold     */

static const char *TAG = "S-ECU";

/* ---------------------------- SHARED STATE TYPE --------------------------- */
/* Icon array order — the FRONTEND MUST MATCH THIS EXACTLY:
 * [0]=headlights [1]=check_engine [2]=battery [3]=high_temp [4]=low_fuel      */
#define NUM_ICONS 5
typedef struct {
    int speed;       /* 0..200  km/h */
    int rpm;         /* 0..7000      */
    int fuel;        /* 0..100  %    */
    int temp;        /* 0..130  C    */
    int ignition;    /* 0/1          */
    int icons[NUM_ICONS];
} dash_state_t;

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
static int adc_read_speed(void)
{
    int sum = 0, raw = 0;
    for (int i = 0; i < ADC_AVG_SAMPLES; i++)
        if (adc_oneshot_read(s_adc, POT_ADC_CHANNEL, &raw) == ESP_OK) sum += raw;
    int avg = sum / ADC_AVG_SAMPLES;                 /* 0..4095 */
    return (avg * SPEED_MAX_KMH) / 4095;             /* 0..200  */
}

/* ----------------------------- GAUGE SIM ---------------------------------- */
/* One pot drives speed; everything below is modelled. Swap any line for a real
 * adc_read on another ADC1 channel if you wire more pots.                     */
static float f_fuel = 100.0f;
static float f_temp = AMBIENT_C;

static int sim_rpm(int speed, bool ign)
{
    if (!ign)       return 0;
    if (speed <= 0) return 800;                      /* idle */
    static const int gear_top[] = {30, 55, 85, 120, 160, 200};
    const int ngear = sizeof(gear_top) / sizeof(gear_top[0]);
    int g = 0;
    while (g < ngear - 1 && speed > gear_top[g]) g++;
    int lo = g ? gear_top[g - 1] : 0;
    float frac = (float)(speed - lo) / (float)(gear_top[g] - lo);
    return 900 + (int)(frac * (6200 - 900));         /* sweeps, drops on shift */
}

static void sim_slow(int rpm, bool ign, float dt)
{
    if (ign) {
        f_fuel -= dt * (0.015f + rpm * 0.0000018f);  /* burns with engine load */
        float target = 75.0f + (rpm / 6500.0f) * 45.0f;  /* up to ~120 at redline */
        f_temp += (target - f_temp) * dt * 0.06f;    /* first-order warmup */
    } else {
        f_temp += (AMBIENT_C - f_temp) * dt * 0.02f; /* cools when off */
    }
    if (f_fuel < 0)   f_fuel = 0;
    if (f_fuel > 100) f_fuel = 100;
}

/* ------------------------------ INPUT TASK -------------------------------- */
static void input_task(void *arg)
{
    int64_t last_press[NUM_BTN] = {0};
    const float dt = INPUT_PERIOD_MS / 1000.0f;

    while (1) {
        /* 1. debounced buttons (ISR queued raw events; we filter bounce here) */
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

        /* 2. throttle -> speed (gated by ignition) -> derived gauges */
        int speed = s_ignition ? adc_read_speed() : 0;
        int rpm   = sim_rpm(speed, s_ignition);
        sim_slow(rpm, s_ignition, dt);

        /* 3. assemble snapshot + warning icons */
        dash_state_t st = {
            .speed    = speed,
            .rpm      = rpm,
            .fuel     = (int)(f_fuel + 0.5f),
            .temp     = (int)(f_temp + 0.5f),
            .ignition = s_ignition,
        };
        st.icons[0] = s_headlights;
        st.icons[1] = s_check_eng;
        st.icons[2] = !s_ignition;                   /* battery: on when off  */
        st.icons[3] = (st.temp >= HIGH_TEMP_C);
        st.icons[4] = (st.fuel <= LOW_FUEL_PCT);

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
    char buf[96];
    const TickType_t period = pdMS_TO_TICKS(1000 / TELEMETRY_HZ);

    while (1) {
        vTaskDelay(period);                          /* pace at TELEMETRY_HZ */
        if (xQueuePeek(s_state_q, &st, 0) != pdTRUE) continue;

        int64_t now = esp_timer_get_time();
        bool changed   = memcmp(&st, &last, sizeof(st)) != 0;
        bool heartbeat = (now - last_tx) > TX_HEARTBEAT_US;
        if (!changed && !heartbeat) continue;        /* idle => silent link  */

        int len = snprintf(buf, sizeof(buf),
            "{\"s\":%d,\"r\":%d,\"f\":%d,\"t\":%d,\"ign\":%d,"
            "\"i\":[%d,%d,%d,%d,%d]}",
            st.speed, st.rpm, st.fuel, st.temp, st.ignition,
            st.icons[0], st.icons[1], st.icons[2], st.icons[3], st.icons[4]);

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
    esp_netif_create_default_wifi_ap();

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
    if (strlen(WIFI_PASS) == 0) ap.ap.authmode = WIFI_AUTH_OPEN;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "SoftAP up: SSID '%s'  ->  http://192.168.4.1", WIFI_SSID);
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