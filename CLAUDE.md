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
- **VS Code ESP-IDF extension:** the workspace is multi-root (`S-ECU.code-workspace`); the IDF
  project lives in `Firmware/Smart_ECU/` (the repo root has no `CMakeLists.txt`). Select
  **Smart_ECU (firmware)** as the active ESP-IDF project in the status bar, or the extension's
  set-target/build/flash fail with "CMakeLists.txt not found". Terminal `idf.py` is unaffected
  (you `cd` into the firmware dir). Also: if a shell exported `IDF_TARGET=esp32`, `set-target
  esp32s3` errors as "not consistent with target … in the environment" — `unset IDF_TARGET`.

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

The device is **read-only: the throttle pot is the only physical input.** The
three push-buttons (ignition/headlights/check-engine on GPIO5/6/7) were removed
— the engine is always running (idles at minimum, revs with the pot) and the
cam (CMP) scope mode is fixed to sync (`cm`=0).

---

## Data contract (firmware ↔ frontend)
**Source of truth: `dashboard-ui/src/lib/protocol.ts`.** Mirror any change there AND in
`main.c` `telemetry_task` in the same step. Minified JSON, integer-biased short keys,
sent on change + a 0.5 s heartbeat over `ws://<host>/ws` (ESP → browser only):
```
{"rpm":850,"ld":12,"maf":7,"map":52,"iat":42,"cts":88,"igf":97,"ev":1380,"cur":140,"amp":1820,"sv":500,"iac":120,"hip":45,"st":4095,"cm":0,"cp":10}
```
| key | meaning | encoding / range |
|-----|---------|------------------|
| `rpm` | engine speed | int 0–7500 |
| `ld` | load / throttle | percent int 0–100 (browser uses `ld/100`) |
| `maf` | mass air flow | int g/s 0–400 |
| `map` | manifold abs. pressure | int kPa 0–250 |
| `iat` | intake air temp | int °C (may be negative) |
| `cts` | coolant temp | int °C (may be negative) |
| `igf` | ignition feedback | int % 0–100 |
| `ev` | ECU voltage | int volts×100 (1380 = 13.80 V), 0–2500 |
| `cur` | ECU self-consumption (external CT) | int amps×100 (140 = 1.40 A), 0–2000 |
| `amp` | engine/system current | int amps×100 (1820 = 18.20 A), 0–6000 |
| `sv` | sensor Vref | int volts×100 (500 = 5.00 V), 0–500 |
| `iac` | IAC stepper position | int 0–200 |
| `hip` | GDI high-pressure fuel rail | int bar 0–250 |
| `st` | digital status bitmask | 12-bit, bit i = `STATUS_BIT_ORDER[i]` |
| `cm` | cam (CMP) mode for scope | 0 sync / 1 advance / 2 fault |
| `cp` | cam phase offset | int crank deg |

Status bit order (bit 0…11): `battery, switch, start, etc, fan1, fan2, fuelPump,
immoP, immoN, mrcP, mrcN, iac` — must match `main.c` `ST_*` enum.

**Derived browser-side, NOT streamed:** the CKP/CMP oscilloscope, the CAN HI/LO bus traces,
and the coil / port-injector / GDI-injector firing animations are computed from `rpm`
(+ `cm`/`cp`) in `useEcuEngine`, per the locked "fluidity = cadence + interpolation"
decision. (Streaming a real 500 kbit/s differential CAN bus over the 30 Hz telemetry link
is impractical, so `CanScope` animates a representative recessive/dominant frame instead.)
When the WS link is live the dashboard runs on real telemetry; when no frame arrives it
falls back to the in-browser simulation (`useEcuLink` → `connectedRef`). Reserved extension:
add `cl`/`in` 8-bit masks for real per-channel coil/injector sensing.

## Firmware architecture (locked)
- **SoftAP**, multiple simultaneous viewers supported.
- **WebSocket server is part of `esp_http_server`** (`CONFIG_HTTPD_WS_SUPPORT=y`,
  `.is_websocket = true`). There is **no separate `esp_websocket_server` component.**
- **Push:** telemetry task → `httpd_queue_work()` → `httpd_ws_send_frame_async()`, broadcast to
  all clients from `httpd_get_client_list()` (filtered by `httpd_ws_get_fd_info()`).
- **FreeRTOS:** input task on core 1 (ADC oneshot + boxcar averaging);
  telemetry task on core 0 at **30 Hz**. Shared state is lock-free: length-1 queue +
  `xQueueOverwrite` / `xQueuePeek`.
- **One pot = LOAD (real). rpm + all analog/digital channels are MODELLED** in firmware
  (`input_task` rev model + `model_status`), mirroring `dashboard-ui/src/lib/sim.ts` so the
  live stream matches the browser sim. To drive any channel from real hardware, add an ADC1
  channel / GPIO and replace that one assignment.
- No buttons/switches: read-only device. Engine always running; cam mode fixed to sync (`cm`=0).
- UI embedded **gzipped** via `EMBED_FILES`, served with `Content-Encoding: gzip`.
- **Telemetry is display-only** (ESP → web). No command channel back.

## Frontend integration (locked)
- Single SoftAP origin; **everything inlined into one gzipped `index.html`**. **No raster images.**
  Built from the React app in `dashboard-ui/` via `vite-plugin-singlefile` (fonts base64-inlined,
  zero external refs).
- **WS client** `useEcuLink`: same-origin `ws://${location.host}/ws`, exponential-backoff
  reconnect, display-only. Drops to the in-browser simulation when no frame arrives (stale > 1.5 s)
  so the bundle also runs standalone. TopBar badge: **Live / Link… / Simulation** (a
  connection-uptime timer ticks alongside it once live).
- **Live override** lives in `useEcuEngine`: when `connectedRef` is true, the frame drives
  rpm/load/analog (incl. cts/igf)/voltages/currents (cur/amp)/IAC/HI-P/status/cam; the CKP/CMP
  scope, CAN HI/LO traces, and coil / port- + GDI-injector firings stay derived from the streamed
  `rpm` (+`cm`/`cp`). Gauges glide via CSS/SVG transforms at 30 Hz cadence.

## Non-negotiable constraints / gotchas
1. WebSocket server = `esp_http_server` (not a separate component).
2. Pot on **ADC1 only** — ADC2 is unusable while Wi-Fi runs.
3. Telemetry is display-only unless a command path is explicitly decided.
4. No raster images — static SVG + CSS transforms only.
5. Re-gzip the UI **before every build** (`gzip -kf -9`), or you flash a stale page.
6. `idf.py` builds with **Ninja**; if `build/` was ever generated with Unix Makefiles
   (e.g. by the VS Code CMake Tools extension) you hit *"generator Ninja does not match
   ... Unix Makefiles"* — `rm -rf build` and rebuild (the dir is fully regenerable).

---

## Current state
- **DONE:** `main.c` (backend + ECU signal model emitting the new contract),
  `dashboard-ui/` React dashboard (gauges, voltages, 8 coils/8 injectors, CKP/CMP scope,
  12 status, sim console, debug panel), `protocol.ts` + `useEcuLink` WS client + live override,
  `CMakeLists.txt` / `sdkconfig.defaults`, UI embedded as `index.html.gz`.
  RPM hero now shows a live **LOAD %** readout (the pot value, driven by `state.load`).
- **VERIFIED (2026-06-25):** firmware builds, flashes, and boots on real ESP32-S3 (N16 R8).
  Boot log: `SoftAP up: SSID 'S-ECU' (open) -> http://10.10.10.10`, DHCP server up,
  backend running. App 1.15 MB in the 3 MB factory partition (63% free).
- **VERIFIED (2026-06-25):** browser connects over SoftAP, page serves, WebSocket handshake
  succeeds (`WS client connected`), live telemetry streams → dashboard shows "Live · ESP".
  (Benign log noise: OS captive-portal probe resets one early `/` fetch → `error in send :104`;
  browser `/favicon.ico` → 404.)
- **VERIFIED (2026-06-26):** rebuilt + reflashed clean after the fixes below; boots fine
  (`SoftAP up ... http://10.10.10.10`, DHCP up, backend running). App 1.15 MB written + verified.
  Fixes this build: live LOAD % readout (engine was emitting stale `c.load`); IAT model load
  coeff `14→70` in `main.c` + `sim.ts` so FAN1 (>70) / FAN2 (>84) are reachable under sustained
  load; CMP fault mode now actually drops the whole pulse every 3rd cycle (was a dead branch).
  Contract unchanged — `iat` encoding is identical, only the model output range widened.
- **VERIFIED (2026-06-28):** full dashboard redesign built, embedded, flashed, and booting on
  hardware (`SoftAP up ... http://10.10.10.10`, DHCP up, backend running; app 1.14 MB, 64% free).
  Layout reworked to match the hand-drawn sketch as a 3-column grid (TV + mobile):
  - **LEFT:** CKP/CMP oscilloscope · 6 analog gauges (2×3: CTS, MAF, MAP, IAT, 5V, IGF) ·
    System rail (BAT / SW ON / MRC+ / MRC−).
  - **CENTER:** big **half-circle needle RBM tachometer** (`Tachometer.tsx`, replaced the old
    horizontal RPM bar; restyled after a classic VW/Audi cluster photo — black dished face,
    segmented teal outer ring, red inner band + redline zone, white numbers, red sweep needle,
    "1/min x 1000" caption; no in-gauge tell-tales; 0–8 ×1000 scale, 6500 redline unchanged) ·
    **CAN HI/LO scope** (`CanScope.tsx`).
  - **RIGHT:** Power · ECU LED panel (`PowerDisplay.tsx` + `SevenSegDisplay.tsx`: ECU-CT current
    headline + V/A) · Ignition Coils ×8 · Injectors ×8 (port) · Status clusters
    (`StatusCluster.tsx`: ST·ETC / FPC / FAN / IMO / IAC — see the 2026-07-01 update below for
    the headerless, icon-per-block layout) · **INJ GDI ×8 + HI P** rail.
  - **Contract extended** with 5 new streamed keys — `cts, igf, cur, amp, hip` — mirrored
    byte-for-byte in `protocol.ts` + `main.c`; CAN traces and GDI injectors are derived
    browser-side (same pattern as CKP/CMP + coils). New SVG art for coils (`CoilIndicator.tsx`,
    red pencil-coil) and injectors (`InjectorAnimation.tsx`, now takes a `prefix` for I/G banks).
  - TopBar: wall-clock replaced with a connection-uptime timer; badge "Live · ESP" → "Live";
    IDF chip removed; AP/IP/FPS contrast fixed for the light theme; AL-AYED logo + spark mark.
  - Removed dead components: `RpmBar.tsx`, `VoltageMeter.tsx`, `StatusIndicator.tsx`.
- **UPDATED (2026-07-01):** Status panel + System rail visual overhaul in
  `StatusCluster.tsx` (all **frontend-only, data contract untouched**), flashed to hardware:
  - **System rail icons redrawn as SVG** (no raster, per constraint #4): `BatteryIcon`
    (automotive battery tell-tale, −/+ knocked out) for BAT and `CarKeyIcon` (car+key
    immobilizer) for SW ON — both rendered as **warning-lamp lenses** (black lens / red
    symbol) via a new `lamp` prop on `SystemChip`. MRC+/MRC− use `RelayIcon` (relay
    schematic) as **white-lens / black-symbol** via a `schematic` prop; when the relay is
    energized the switch arm drops to a closed horizontal contact and the symbol turns red
    (`#ff2d3a`, `closed` prop). System chips enlarged to square (`h-14 w-14 md:h-16`).
  - **Status clusters (`StatusGroup`) stripped and re-laid-out:** group titles
    (FPC/FAN/IMO/IAC) and lucide icons (Power/Fuel/Fan/Hand/Cog) removed (`title`/`icon`
    props + lucide import deleted). LED rows pushed to the bottom (`h-full` + `mt-auto`) and
    **split to opposite corners** (`w-full justify-between`); LED labels (ST/ETC/−/+/1/2)
    moved **above** the dots. The panel's "STATUS" header was removed (Status `HudPanel` in
    `App.tsx` no longer passes `title`/`accent`) to give the blocks full height.
  - **Stylized SVG "part photos" added below the LEDs** (blocks 2–5; ST/ETC has none),
    sized `art = "h-8 w-8 md:h-9 md:w-9"`: `FuelPumpArt` (Bosch brushed-metal cylinder) for
    FPC, `FanArt` (Noctua axial fan: beige frame, brown corner mounts, 9 curved blades) for
    FAN, `ImmobilizerArt` (**key-inside-car** tell-tale: red car side-profile outline + solid
    key) for IMO, `IacValveArt` (black stepper valve + copper collar + spring + pintle) for
    IAC. All hand-drawn SVG (reference photos redrawn, never embedded as raster).
  - Injector spray: `InjectorAnimation.tsx` now renders a soft blurred misty cone below each
    injector (port + GDI) when it pulses (`mist` keyframe in `index.css`); port bank redrawn
    as a Bosch-style injector (`PortInjectorSvg`) while the GDI bank keeps its original art
    (`GdiInjectorSvg`), branched on `prefix === "G"`; gauge label moved above center + digital
    readout moved to the bottom of the dial in `Gauge.tsx`.
- **UPDATED (2026-07-01, art pass):** SVG illustration refinements only — **frontend-only, data
  contract untouched** — built + embedded into firmware (`index.html` 649253 B / `index.html.gz`
  336383 B), committed & pushed (NOT yet flashed on-device this pass):
  - `StatusCluster.tsx` — `ImmobilizerArt` redrawn as an **SUV side-profile tell-tale** (flat
    vertical tailgate, red outline, no trunk overhang) with a **red key centered inside the
    body**, teeth pointing down, arrow tip removed. `IacValveArt` fully rewritten as a
    **realistic sharp-edged rectangular IAC valve** (radial/linear metal gradients, blur
    filters for soft rim + ground shadow, knurled brass collar, 3D coil spring, bullet nose,
    ribbed electrical connector) — replaces the earlier flat stepper sketch.
  - `InjectorAnimation.tsx` — port injector (`PortInjectorSvg`) electrical connector rotated to
    point up to **11 o'clock** (`rotate(-62 18 36)`). New exported **`HpPumpArt`** component: a
    GDI high-pressure fuel pump (grey solenoid connector, faceted hex body, domed head, oval
    flange, tappet return spring) drawn as pure SVG.
  - `App.tsx` — imports `HpPumpArt` and renders it in the **HI P** cell of the INJ GDI panel
    (above the bar reading), replacing the plain readout tile.
  - All hand-drawn SVG (gradients/paths/filters), no raster — constraint #4 upheld.
- **NOT YET TESTED:** on-device visual confirmation of the new layout; multi-client broadcast,
  gauge latency under load, pot→load mapping, every status bit — bench test pending.

## Punchlist
1. [DONE] `idf.py build flash` verified on hardware — `main.c` ECU model compiles clean;
   added `partitions.csv` (3 MB app) + 16 MB flash config so the UI-embedded binary fits.
2. Wire hardware (pinout above); confirm pot maps cleanly to 0–100 % load.
3. Bench test: SoftAP, multi-client broadcast, **Live badge** on connect, gauge latency,
   reconnect/sim-fallback, every status bit toggling correctly.
   (FAN1/FAN2 reachable: hold the pot at high load — IAT climbs past 70/84 °C.
   START only blips during the <1 s rpm spin-up through 1–600 at power-on.)
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
- IAT model load coefficient kept deliberately aggressive (×70) so fan thresholds are
  reachable on the bench from the single pot; mirrored byte-for-byte in `main.c` + `sim.ts`.
- Read-only device: the 3 push-buttons (GPIO5/6/7) were removed. Engine always runs
  (idles → revs with the pot, the only physical input); cam mode fixed to sync (`cm`=0).
  Tradeoff: engine-off/standby and cam advance/fault are no longer demonstrable on the bench.
- Layout is height-aware (Tailwind `raw` screens `fit`/`short`): portrait, landscape, and
  TV all render as a single no-scroll view — `short` (wide-but-short) is a dense no-scroll
  grid, not a scrollable fallback.
- Dashboard layout matches the hand-drawn sketch: a fixed **3-column grid** (left sensors /
  center tach+CAN / right power+coils+injectors+status+GDI) on `short`/`fit`, stacked-scrollable
  on phones. The horizontal RPM bar was replaced by a half-circle needle tach (styled after a
  classic VW/Audi cluster photo, no in-gauge tell-tales); the top-left waveform was dropped from
  the hero in favor of this denser arrangement.
- The "8.8.8" headline LED display = **ECU self-consumption current from an external CT**
  (`cur`), not engine current. A separate plausible engine/system current (`amp`) drives the
  V/A sub-panel. Both are modelled in firmware to match the browser sim.
- New signals (`cts/igf/cur/amp/hip`) are streamed; CAN HI/LO and GDI injectors are derived
  browser-side. Streaming a real 500 kbit/s CAN bus over the 30 Hz link is impractical, so the
  CAN scope animates a representative recessive/dominant frame from `rpm` activity instead.
