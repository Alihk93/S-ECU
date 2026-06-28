# S-ECU (Smart ECU Tester) — Project Handoff

Paste-ready summary for resuming work in a fresh session. For deeper detail and the
decisions log, see `CLAUDE.md` (the project source-of-truth doc).

## What it is
Real-time, low-latency hardware-in-the-loop **car-dashboard simulator**. An **ESP32-S3**
reads one physical input (throttle pot), models a full ECU signal set, and pushes live
telemetry over **WebSocket** to a **cyberpunk web dashboard** that the device serves from
its own Wi-Fi SoftAP.

## Stack
ESP32-S3 (N16 R8) · ESP-IDF v5.5.2 · FreeRTOS · C firmware · React 18 + TypeScript + Vite 8
+ Tailwind 3.4 · `vite-plugin-singlefile` · lucide-react · KiCad · GitHub
(`https://github.com/Alihk93/S-ECU.git`, branch `main`). Dev on Ubuntu.

## Repo layout
```
dashboard-ui/                React+TS+Vite dashboard (the real frontend)
  src/lib/protocol.ts          DATA CONTRACT — SOURCE OF TRUTH (mirror in main.c)
  src/lib/ecu.ts               gauge defs, RANGES, EcuState, status keys
  src/lib/sim.ts               in-browser simulation engine + signal models
  src/hooks/useEcuLink.ts      WS client (auto-reconnect, sim fallback)
  src/hooks/useEcuEngine.ts    30Hz state engine + live override; refs for scopes
  src/components/dashboard/*   all widgets (see below)
  bundle.html                  single self-contained build output
Firmware/Smart_ECU/
  main/main.c                  SoftAP + WS broadcast + ADC input + ECU signal model
  main/web/index.html(.gz)     copy of bundle.html + its gzip (gz is embedded)
  main/CMakeLists.txt          EMBED_FILES "web/index.html.gz"
  partitions.csv               3 MB factory app (binary ~1.14 MB)
  sdkconfig.defaults           WS support, 16MB flash, custom partitions
CLAUDE.md                      project source-of-truth doc
HANDOFF.md                     this file
References/                    source photos (coil, injector, sketch, RPM gauge)
AL-AYED_Logo.png               logo reference
```

## Architecture (locked)
- **SoftAP**, multiple simultaneous viewers → **broadcast** to all WS clients.
- **WebSocket server = part of `esp_http_server`** (`CONFIG_HTTPD_WS_SUPPORT=y`,
  `.is_websocket=true`). No separate `esp_websocket_server` component.
- **Push:** telemetry task → `httpd_queue_work()` → `httpd_ws_send_frame_async()`, broadcast
  via `httpd_get_client_list()`.
- **FreeRTOS:** input task core 1 (ADC oneshot + boxcar avg); telemetry task core 0 at
  **30 Hz**. Lock-free shared state: length-1 queue + `xQueueOverwrite`/`xQueuePeek`.
- **Display-only** (ESP → browser). No command/RX channel.
- UI embedded **gzipped** via `EMBED_FILES`, served with `Content-Encoding: gzip`.
- **One pot = LOAD (real).** rpm + all other channels are **modeled in firmware** (mirroring
  `sim.ts`) so the live stream matches the browser sim. Read-only device — the 3 push-buttons
  were removed; engine always runs (idle→rev with pot); cam mode fixed to sync.
- **Derived browser-side, NOT streamed:** CKP/CMP oscilloscope, CAN HI/LO traces, and coil /
  port-injector / GDI-injector firing animations — all computed from `rpm` (+cm/cp) in
  `useEcuEngine`.
- WS live drives the dashboard; **auto-fallback to in-browser sim** when no frame arrives
  (stale > 1.5 s).

## Data contract (firmware ↔ frontend)
**Source of truth: `dashboard-ui/src/lib/protocol.ts`. Mirror byte-for-byte in `main.c`
`telemetry_task`.** Minified JSON, integer-biased short keys, 30 Hz on-change + 0.5 s
heartbeat over `ws://<host>/ws`.

Example frame:
```json
{"rpm":850,"ld":12,"maf":7,"map":52,"iat":42,"cts":88,"igf":97,"ev":1380,"cur":140,"amp":1820,"sv":500,"iac":120,"hip":45,"st":4095,"cm":0,"cp":10}
```
| key | meaning | encoding/range |
|-----|---------|----------------|
| rpm | engine speed | int 0–7500 |
| ld | load/throttle | % int 0–100 (browser uses ld/100) |
| maf | mass air flow | int g/s 0–400 |
| map | manifold abs pressure | int kPa 0–250 |
| iat | intake air temp | int °C (may be neg) |
| cts | coolant temp | int °C |
| igf | ignition feedback | int % 0–100 |
| ev | ECU voltage | int V×100 (1380=13.80V), 0–2500 |
| cur | ECU self-consumption (external CT) | int A×100 (140=1.40A), 0–2000 |
| amp | engine/system current | int A×100 (1820=18.20A), 0–6000 |
| sv | sensor Vref | int V×100 (500=5.00V), 0–500 |
| iac | IAC stepper position | int 0–200 |
| hip | GDI high-pressure rail | int bar 0–250 |
| st | digital status bitmask | 12-bit, bit i = STATUS_BIT_ORDER[i] |
| cm | cam (CMP) scope mode | 0 sync / 1 advance / 2 fault |
| cp | cam phase offset | int crank deg |

Status bit order (0…11): `battery, switch, start, etc, fan1, fan2, fuelPump, immoP, immoN,
mrcP, mrcN, iac` — must match `main.c` ST_* enum. (`cm` is fixed to 0/sync on the read-only
device.) Reserved extension: add `cl`/`in` 8-bit masks for real per-channel coil/injector
sensing.

## Frontend layout (3-column grid, matches the hand-drawn sketch)
Height-aware via Tailwind `raw` screens `short` (wide+short landscape) and `fit` (wide+tall/TV)
→ single no-scroll view; stacked-scrollable on phones.
- **LEFT:** CKP/CMP oscilloscope (`WaveformScope`) · 6 analog gauges 2×3 (CTS, MAF, MAP, IAT,
  5V, IGF — `Gauge.tsx`) · System rail (BAT/SW ON/MRC+/MRC− — `StatusCluster.tsx`
  `SystemIcons`).
- **CENTER:** **half-circle needle RBM tachometer** (`Tachometer.tsx` — classic VW/Audi style:
  black dished face, segmented teal outer ring, red inner band + redline, white 0–8 numbers,
  red needle, "1/min x 1000" caption, **no in-gauge tell-tales**; 0–8 ×1000 scale, 6500
  redline; live RBM + LOAD readouts below) · **CAN HI/LO scope** (`CanScope.tsx`).
- **RIGHT:** Power·ECU LED panel (`PowerDisplay.tsx` + `SevenSegDisplay.tsx`) · Ignition Coils
  ×8 (`CoilIndicator.tsx`, red pencil-coil SVG) · Injectors ×8 port (`InjectorAnimation.tsx`,
  prefix "I") · Status clusters (ST·ETC/FPC/FAN/IMO/IAC) · **INJ GDI ×8 + HI P** rail
  (injectors prefix "G").
- **PowerDisplay** details: headline = **ECU-CT current** (`cur`) as a 3-digit **dotted**
  seven-seg (`8.8.8.` look, red); right sub-panel = ecuV (green) + amp (cyan) in a **slimmer
  dark box** (thinner padding, `items-center` so it doesn't stretch to the headline's height).
  The `8.8.8` headline = ECU self-consumption from an external CT, *not* engine current.
- **TopBar:** connection-uptime timer (replaced wall-clock), badge **Live/Link…/Simulation**,
  AL-AYED logo + spark mark, IDF chip removed, light-theme contrast fixed.
- **Removed dead components:** RpmBar, VoltageMeter, StatusIndicator.

## HTML / build pipeline
- Everything inlined into **one gzipped `index.html`** (fonts base64-inlined, **no raster
  images** in the bundle — SVG/CSS only).
- Build (pnpm script wrapper is broken — call the vite binary directly):
  ```bash
  cd dashboard-ui && node_modules/.bin/vite build      # → dist/index.html
  cp dist/index.html bundle.html
  cp bundle.html ../Firmware/Smart_ECU/main/web/index.html
  gzip -kf -9 ../Firmware/Smart_ECU/main/web/index.html
  ```
  Typecheck: `node_modules/.bin/tsc --noEmit`. Current bundle ≈ 631 KB raw / 334 KB gzip.

## Firmware build / flash / run
**Env (mandatory order — system python is 3.14, IDF venv is 3.13):**
```bash
export PATH=/home/ali/.pyenv/versions/3.13.4/bin:$PATH
export IDF_TOOLS_PATH=/home/ali/ESP_IDF/Version_5.5.2/IDF_Tool_v5.5.2
export IDF_PATH=/home/ali/ESP_IDF/Version_5.5.2/IDF_v5.5.2/v5.5.2/esp-idf
unset IDF_TARGET          # else set-target esp32s3 conflicts
. "$IDF_PATH/export.sh"    # never pipe this
```
```bash
idf.py set-target esp32s3                       # one-time
gzip -kf -9 main/web/index.html                 # re-gzip BEFORE every build
idf.py -p /dev/ttyUSB0 build flash monitor      # board = /dev/ttyUSB0 (or ttyACM0)
```
Join Wi-Fi **`S-ECU`** (pass `0000` → **OPEN** AP, <8 chars), open **`http://10.10.10.10`**.
- Flash layout: app ~1.14 MB in a 3 MB factory partition (64% free), 16 MB flash.
- `main/CMakeLists.txt` REQUIRES: `esp_http_server esp_wifi nvs_flash esp_adc driver
  esp_netif esp_event esp_timer`; `EMBED_FILES "web/index.html.gz"`.
- `sdkconfig.defaults`: `CONFIG_HTTPD_WS_SUPPORT=y` (1st line, mandatory or ws won't link),
  `CONFIG_LWIP_MAX_SOCKETS=16`, `CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y`,
  `CONFIG_PARTITION_TABLE_CUSTOM=y` + filename. After editing it, delete generated `sdkconfig`.
- **Monitor over a TTY-less shell fails** ("requires standard input to be attached to TTY") —
  read boot log via pyserial (reset pulse: DTR low, RTS pulse) instead.

## Hardware
| Signal | GPIO | Notes |
|--------|------|-------|
| Throttle pot | GPIO4 | ADC1 / ADC_CHANNEL_3. **ADC1 only — ADC2 dies with Wi-Fi.** |

Read-only device — pot is the only physical input. Buttons removed. IAT model load coeff is
deliberately aggressive (×70) so FAN1 (>70 °C) / FAN2 (>84 °C) are reachable from the single
pot; mirrored in `main.c` + `sim.ts`.

## Current state (all committed + pushed)
- ✅ Firmware + full redesigned dashboard built, embedded, **flashed, and booting on
  hardware**: `SoftAP up: SSID 'S-ECU' (open) -> http://10.10.10.10`, DHCP up, backend running.
- ✅ Latest session: full 3-column redesign; 5 new streamed signals (cts/igf/cur/amp/hip);
  new components (Tachometer, PowerDisplay, SevenSegDisplay, CanScope, StatusCluster); new
  coil/injector SVG art; TopBar uptime timer; half-circle photo-style tach (indicators
  removed); PowerDisplay 3-digit dotted headline + slimmer V/A box; dead components removed;
  CLAUDE.md updated. All verified `tsc`/`vite build` clean and flashed.
- Verified earlier: SoftAP, page serve, WS handshake, live telemetry "Live" badge.

## Punchlist / what's left
1. **On-device visual confirmation** of the final layout (tach, PowerDisplay, coils/injectors).
2. **Bench test:** multi-client broadcast, gauge latency under load, pot→LOAD 0–100% mapping,
   reconnect/sim-fallback, every status bit toggling (FAN1/FAN2 via sustained high load → IAT
   past 70/84; START blips only during <1 s power-on rpm spin-up).
3. Wire any additional real hardware channels (each = add one ADC1 ch/GPIO and replace that
   modeled assignment).
4. (Optional) Real per-channel coil/injector sensing → add `cl`/`in` masks to the contract.
5. (Optional) mDNS `s-ecu.local`, captive portal.

## Key gotchas (don't relearn the hard way)
1. WS server = `esp_http_server`, not a separate component.
2. Pot on **ADC1 only**.
3. Telemetry display-only (no command path).
4. **No raster images** in the bundle — SVG + CSS only.
5. **Re-gzip the UI before every firmware build**, or you flash a stale page.
6. `idf.py` uses **Ninja**; if `build/` was made with Make → `rm -rf build`.
7. The protocol is **byte-for-byte** — any contract change updates `protocol.ts` AND `main.c`
   in the same step.
8. **Serial-port contention:** `/dev/ttyUSB0` is sometimes held by an unrelated **SFAS_IND04**
   (esp32c6) monitor in another terminal — free it (Ctrl+]) before flashing. The board also
   occasionally drops off the bus (re-seat USB).
