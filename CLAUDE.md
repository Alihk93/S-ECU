# CLAUDE.md — S-ECU (Smart ECU Tester)

Real-time, low-latency hardware-in-the-loop car dashboard simulation. An ESP32-S3 reads physical
inputs and pushes live telemetry over WebSockets to a professional/cyberpunk web dashboard that
the device serves from its own Wi-Fi (speedo, tach, fuel, temp, warning lights).

---

## How to work in this repo (read before doing anything)
- **This file + the actual repo files are the source of truth.** They win over memory or older
  chat messages. Open the real file before proposing, editing, or debugging — never reconstruct
  code from memory.
- Show edits as **VS Code-style diffs (`+`/`-`)** against the current file.
- **Flag assumptions explicitly.** Surface engineering tradeoffs and give a clear recommendation.
- The **firmware↔frontend JSON contract is byte-for-byte** — any change updates BOTH `main.c`
  and `dashboard.js` in the same step.
- After a meaningful change: note what to update in this file and give a **suggested commit message**.
- If context is missing here or in the repo, **ask before guessing.**

## Stack
ESP32-S3 · ESP-IDF v5.5.2 · VS Code on Ubuntu · KiCad · GitHub. Firmware in C; web UI authored
via Claude Code against the contract below.

---

## Repo layout
```
dashboard-ui/         [DONE] React+TS+Vite dashboard source (the real frontend)
  src/lib/protocol.ts   data-contract SOURCE OF TRUTH (mirror in main.c)
  src/hooks/useEcuLink.ts   WS client (auto-reconnect, sim fallback)
  src/hooks/useEcuEngine.ts simulation engine + live override
  bundle.html           single self-contained build (vite-plugin-singlefile)
Firmware/Smart_ECU/
  main/
    main.c              [DONE] SoftAP + WS broadcast + input/telemetry + ECU signal model
    web/
      index.html        [BUILD] copy of dashboard-ui/bundle.html
      index.html.gz     [BUILD] gzip of the above; this is what main.c embeds
    CMakeLists.txt      [DONE] EMBED_FILES "web/index.html.gz"
  sdkconfig.defaults    [DONE] CONFIG_HTTPD_WS_SUPPORT=y + LWIP_MAX_SOCKETS=16
CLAUDE.md             this file
```
Frontend build: in `dashboard-ui/`, `node_modules/.bin/vite build` → `bundle.html`
(pnpm's script wrapper currently breaks on ERR_PNPM_IGNORED_BUILDS — call the vite binary
directly). Then copy `bundle.html` → `Firmware/Smart_ECU/main/web/index.html` and gzip.

## Build / flash / run
**Env activation (IMPORTANT):** the system `python3` is 3.14 but the IDF tools venv is
Python 3.13, so `export.sh` must run with 3.13 on PATH first or it fails ("virtual
environment not found"):
```bash
export PATH=/home/ali/.pyenv/versions/3.13.4/bin:$PATH
export IDF_TOOLS_PATH=/home/ali/ESP_IDF/Version_5.5.2/IDF_Tool_v5.5.2
export IDF_PATH=/home/ali/ESP_IDF/Version_5.5.2/IDF_v5.5.2/v5.5.2/esp-idf
. "$IDF_PATH/export.sh"        # never pipe this — a pipe loses the PATH changes
```
```bash
# one-time
idf.py set-target esp32s3

# every build — gzip the UI first; main.c embeds index.html.gz
gzip -kf -9 main/web/index.html
idf.py -p /dev/ttyUSB0 build flash monitor   # board enumerates as /dev/ttyUSB0 (or ttyACM0)
```
Then join Wi-Fi **`S-ECU`** (pass `0000` — under 8 chars so the AP comes up **OPEN**;
WPA2-PSK needs ≥8) and open **`http://10.10.10.10`**.

**Flash layout:** the app binary is ~1.15 MB (it embeds the gzipped UI), which overflows the
default 1 MB factory partition. `partitions.csv` gives a 3 MB factory app on the 16 MB (N16)
flash; `sdkconfig.defaults` sets `CONFIG_ESPTOOLPY_FLASHSIZE_16MB` +
`CONFIG_PARTITION_TABLE_CUSTOM`. Build/flash/boot are **verified on hardware** (2026-06-25).

`main/CMakeLists.txt`:
```cmake
idf_component_register(
    SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES esp_http_server esp_wifi nvs_flash esp_adc driver esp_netif esp_event esp_timer
    EMBED_FILES "web/index.html.gz")
```
`sdkconfig.defaults` (first line is mandatory or `httpd_ws_*` won't link):
```
CONFIG_HTTPD_WS_SUPPORT=y
CONFIG_LWIP_MAX_SOCKETS=16
CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y
CONFIG_PARTITION_TABLE_CUSTOM=y
CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions.csv"
```
(after editing `sdkconfig.defaults`, delete the generated `sdkconfig` so it regenerates).

## Hardware
| Signal | GPIO | Notes |
|--------|------|-------|
| Throttle pot | GPIO4 | ADC1 / `ADC_CHANNEL_3`. **ADC1 only — ADC2 dies with Wi-Fi** |
| Ignition button | GPIO5 | active-low, internal pull-up, negedge IRQ |
| Headlights button | GPIO6 | same |
| Check-engine button | GPIO7 | same |

---

## Data contract (firmware ↔ frontend)
**Source of truth: `dashboard-ui/src/lib/protocol.ts`.** Mirror any change there AND in
`main.c` `telemetry_task` in the same step. Minified JSON, integer-biased short keys,
sent on change + a 0.5 s heartbeat over `ws://<host>/ws` (ESP → browser only):
```
{"rpm":850,"ld":12,"maf":7,"map":52,"iat":42,"ev":1380,"sv":500,"iac":120,"st":4095,"cm":0,"cp":10}
```
| key | meaning | encoding / range |
|-----|---------|------------------|
| `rpm` | engine speed | int 0–7500 |
| `ld` | load / throttle | percent int 0–100 (browser uses `ld/100`) |
| `maf` | mass air flow | int g/s 0–400 |
| `map` | manifold abs. pressure | int kPa 0–250 |
| `iat` | intake air temp | int °C (may be negative) |
| `ev` | ECU voltage | int volts×100 (1380 = 13.80 V) |
| `sv` | sensor Vref | int volts×100 (500 = 5.00 V) |
| `iac` | IAC stepper position | int 0–200 |
| `st` | digital status bitmask | 12-bit, bit i = `STATUS_BIT_ORDER[i]` |
| `cm` | cam (CMP) mode for scope | 0 sync / 1 advance / 2 fault |
| `cp` | cam phase offset | int crank deg |

Status bit order (bit 0…11): `battery, switch, start, etc, fan1, fan2, fuelPump,
immoP, immoN, mrcP, mrcN, iac` — must match `main.c` `ST_*` enum.

**Derived browser-side, NOT streamed:** the CKP/CMP oscilloscope and the 8 coil/injector
firing animations are computed from `rpm` (+ `cm`/`cp`) in `useEcuEngine`, per the locked
"fluidity = cadence + interpolation" decision. When the WS link is live the dashboard runs
on real telemetry; when no frame arrives it falls back to the in-browser simulation
(`useEcuLink` → `connectedRef`). Reserved extension: add `cl`/`in` 8-bit masks for real
per-channel coil/injector sensing.

## Firmware architecture (locked)
- **SoftAP**, multiple simultaneous viewers supported.
- **WebSocket server is part of `esp_http_server`** (`CONFIG_HTTPD_WS_SUPPORT=y`,
  `.is_websocket = true`). There is **no separate `esp_websocket_server` component.**
- **Push:** telemetry task → `httpd_queue_work()` → `httpd_ws_send_frame_async()`, broadcast to
  all clients from `httpd_get_client_list()` (filtered by `httpd_ws_get_fd_info()`).
- **FreeRTOS:** input task on core 1 (ADC oneshot + boxcar averaging + debounced button ISR);
  telemetry task on core 0 at **30 Hz**. Shared state is lock-free: length-1 queue +
  `xQueueOverwrite` / `xQueuePeek`.
- **One pot = LOAD (real). rpm + all analog/digital channels are MODELLED** in firmware
  (`input_task` rev model + `model_status`), mirroring `dashboard-ui/src/lib/sim.ts` so the
  live stream matches the browser sim. To drive any channel from real hardware, add an ADC1
  channel / GPIO and replace that one assignment.
- Buttons: ignition = run gate · headlights = cam ADVANCE (`cm`=1) · check-engine = cam FAULT (`cm`=2).
- UI embedded **gzipped** via `EMBED_FILES`, served with `Content-Encoding: gzip`.
- **Telemetry is display-only** (ESP → web). No command channel back.

## Frontend integration (locked)
- Single SoftAP origin; **everything inlined into one gzipped `index.html`**. **No raster images.**
  Built from the React app in `dashboard-ui/` via `vite-plugin-singlefile` (fonts base64-inlined,
  zero external refs).
- **WS client** `useEcuLink`: same-origin `ws://${location.host}/ws`, exponential-backoff
  reconnect, display-only. Drops to the in-browser simulation when no frame arrives (stale > 1.5 s)
  so the bundle also runs standalone. TopBar badge: **Live · ESP / Link… / Simulation**.
- **Live override** lives in `useEcuEngine`: when `connectedRef` is true, the frame drives
  rpm/load/analog/voltages/IAC/status/cam; the CKP/CMP scope and coil/injector firings stay
  derived from the streamed `rpm` (+`cm`/`cp`). Gauges glide via CSS/SVG transforms at 30 Hz cadence.

## Non-negotiable constraints / gotchas
1. WebSocket server = `esp_http_server` (not a separate component).
2. Pot on **ADC1 only** — ADC2 is unusable while Wi-Fi runs.
3. Telemetry is display-only unless a command path is explicitly decided.
4. No raster images — static SVG + CSS transforms only.
5. Re-gzip the UI **before every build** (`gzip -kf -9`), or you flash a stale page.

---

## Current state
- **DONE:** `main.c` (backend + ECU signal model emitting the new contract),
  `dashboard-ui/` React dashboard (gauges, voltages, 8 coils/8 injectors, CKP/CMP scope,
  12 status, sim console, debug panel), `protocol.ts` + `useEcuLink` WS client + live override,
  `CMakeLists.txt` / `sdkconfig.defaults`, UI embedded as `index.html.gz`.
- **VERIFIED (2026-06-25):** firmware builds, flashes, and boots on real ESP32-S3 (N16 R8).
  Boot log: `SoftAP up: SSID 'S-ECU' (open) -> http://10.10.10.10`, DHCP server up,
  backend running. App 1.15 MB in the 3 MB factory partition (63% free).
- **VERIFIED (2026-06-25):** browser connects over SoftAP, page serves, WebSocket handshake
  succeeds (`WS client connected`), live telemetry streams → dashboard shows "Live · ESP".
  (Benign log noise: OS captive-portal probe resets one early `/` fetch → `error in send :104`;
  browser `/favicon.ico` → 404.)
- **NOT YET TESTED:** multi-client broadcast, gauge latency under load, pot→load mapping,
  button behaviour (run gate / cam advance / cam fault), every status bit — bench test pending.

## Punchlist
1. [DONE] `idf.py build flash` verified on hardware — `main.c` ECU model compiles clean;
   added `partitions.csv` (3 MB app) + 16 MB flash config so the UI-embedded binary fits.
2. Wire hardware (pinout above); confirm pot maps cleanly to 0–100 % load.
3. Bench test: SoftAP, multi-client broadcast, **Live badge** on connect, gauge latency,
   reconnect/sim-fallback, cam ADVANCE/FAULT via buttons, every status bit toggling correctly.
4. [DONE] AP creds/IP set to spec: SSID `S-ECU`, IP `10.10.10.10` (static, DHCP server
   handing out the .x range). Pass `0000` is <8 chars so the AP is **OPEN** (WPA2 needs ≥8).
5. (Optional) Real per-channel coil/injector sensing → add `cl`/`in` masks to the contract.
6. (Optional) mDNS `s-ecu.local`, captive portal.

## Decisions log
- Multiple viewers → broadcast (not a single stored fd).
- Display-only → no RX/command path.
- Frontend is the React `dashboard-ui` (ECU-tester signal set), built to one inlined gzip page.
- Pot = LOAD; rpm + all channels modelled in firmware to match the browser sim.
- Coils/injectors + CKP/CMP scope derived browser-side from streamed `rpm`; not streamed.
- WS live drives the dashboard; auto-fallback to in-browser sim when no frames.
- Bandwidth is not the bottleneck; fluidity = fixed 30 Hz cadence + CSS interpolation.
- gzip-embedded single-page UI; lock-free state via length-1 queue.
