# Watchface Studio

Standalone Next.js/TypeScript app for **Garmin Forerunner 970 (fr970)**. Customize, build and download in one browser interface. The app uses Inter typography, an ivory/charcoal theme and shared control conventions.

## Start

From this repository:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. The UI and compiler API start together; there is no second service to launch. This computer's ignored `.env.local` is already configured for the installed SDK, Java and private signing key. For a production local server, run `npm run build` then `npm start`.

Home (`/`) launches preset or scratch designs and shows recent local work. `/presets` and `/presets/[slug]` browse and preview four editable presets; `/watches` and `/watches/[slug]` hold the supported-device catalog and specifications. `/designs` manages browser-local projects, including rename, import/export and deletion with undo. `/editor/[id]` opens a saved project by its unique ID. Unknown preset/watch slugs return 404; missing local project IDs show recovery guidance.

Watch selection persists independently from existing designs. Preset customization creates an independent copy. `watchface.selectedWatch` stores the global watch ID (or null). `watchface.designs` stores an array of projects, each with its own `selectedWatch` matching `design.device`. Choosing a watch from the header, preset flow, or watch card updates the global preference; existing projects keep their target. Only version 1 projects and the current array-based library shape are supported. There are no migrations or fallback readers for earlier formats. New designs remain unsaved until edited, and the `/editor/new` URL stays unchanged while a tab-local session pointer restores the active project on reload. Export/import JSON to move between origins or browsers. No accounts or remote project storage are required.

## First setup on another computer

1. Install the official Garmin SDK using SDK Manager, accept its agreement, and install the Forerunner 970 profile. SDK 9.2.0 was tested.
2. Install JDK 17 or newer.
3. Generate an RSA 4096-bit PKCS8 DER developer key using Garmin's Monkey C extension or OpenSSL. Store it **outside this repository**, accessible only to your user.
4. Copy `.env.example` to `.env.local`; set absolute paths to the SDK, signing key and Java home. Restart the app after configuration changes.

Do not commit the SDK or keys. Compiler status in the app reports missing configuration. The server binds to loopback and accepts same-origin build requests. All compilation is local.

The preview uses labeled sample values and approximates native Garmin glyphs; the simulator remains the reference for fit. Always-on uses dim native time on black, clipped to a bounded region that alternates position each minute. Low battery uses a simplified time-and-battery layout.

## Project files and watch files

- **`.watchface.json`** is the editable current-format design. Export it for backup or movement between browsers. Import validates the format, version, device, exact field set, names, colors, sizes and integer coordinates. The maximum size is 1.5 MB. Unreadable library data remains untouched and autosave is disabled until storage is recovered.
- **`.prg`** is the signed, device-specific executable produced by Garmin. It cannot be imported as an editable project. A `.prg` download is available only after compiler success, and only for the unchanged design snapshot that was built.
- **`.iq`** is a store-distribution package and is not part of this prototype.

An app restart discards build history/downloads. Completed builds expire 15 minutes after creation. Your local project persists independently. Rebuild if a download has expired. Every design uses the same phase-one application ID; installing another generated face replaces this prototype's previous face rather than creating a gallery.

## Generate and compile outside the UI

Export the current project from the editor, then:

```sh
npm run project:export -- path/to/design.watchface.json /new/output/directory
```

The output directory must not already exist. It contains `manifest.xml`, `monkey.jungle`, `source/FaceApp.mc`, strings and launcher icon resources. This uses the same generator as the service.

Garmin's normal command-line path:

```sh
export PATH="$JAVA_HOME/bin:$CIQ_SDK_HOME/bin:$PATH"
monkeyc -d fr970 -f /new/output/directory/monkey.jungle \
  -o /path/to/daily-fr970.prg -y "$CIQ_SIGNING_KEY" -r
connectiq
monkeydo /path/to/daily-fr970.prg fr970
```

The service invokes the official `com.garmin.monkeybrains.Monkeybrains` main class from the SDK's `monkeybrains.jar`, as the SDK's `monkeyc` launcher does. It sets a smaller bounded JVM heap instead of the launcher's 1 GB initial heap. [Garmin CLI and signing guide](https://developer.garmin.com/connect-iq/reference-guides/monkey-c-command-line-setup/).

## Compilation boundaries

`src/watchface/schema.ts` owns validation and serialization. `render-model.ts` owns the shared element/font mapping. `src/components/editor/canvas/WatchPreview.tsx` renders sample data. `generator.ts` emits only fixed templates plus validated literals. `src/library/store.ts` owns browser project persistence and selected-watch context. `src/presets/catalog.ts` defines validated starter designs. `services/watchface/` owns execution, queueing and download delivery.

UI structure: reusable atoms in `src/components/ui`, app chrome in `src/components/layout`, focused editor components and build hook in `src/components/editor`, theme state in `src/providers` and `src/hooks`, and shared icons in `src/icons`. Styles enter once through `src/styles/index.scss`: atomic utilities, global tokens, component SCSS and page layout. No CSS Modules.

`npm run lint` includes token and style contract checks.

The local service:

- Rejects source uploads, extra properties, arbitrary targets, paths, templates, invalid JSON and oversized requests.
- Checks SDK availability, Java and a valid 4096-bit signing key outside the repository, resolving symlinks before checking key location.
- Creates a unique temporary directory per build and deletes it after success or failure. SIGINT/SIGTERM stops the running compiler and waits for cleanup; forced process/OS termination can still leave a temporary directory. Source filenames are generator-owned.
- Runs one compiler at a time, at most four active/queued jobs, at most 20 retained jobs, with a 60-second compile timeout and process termination.
- Limits JVM heap to 256 MB, metaspace to 128 MB and processor count to two; caps logs at 64 KB and retained artifacts at 4 MB each. These are local development limits, not a hostile multi-tenant OS sandbox or a total-process RSS guarantee.
- Uses no shell to execute compiler arguments. On Unix, timeout kills the child process group; on Windows, it kills the directly launched Java process.
- Requires a permitted Origin and JSON content type for POST, rejects unexpected Host headers and origins, binds only loopback, and bounds JSON body size and read time.
- Returns actionable failures, never a simulated successful artifact. Build SHA-256 and compiler output are inspectable in the editor.

## Deployment scope

This version is a personal local Node app. The SDK, device profiles, Java and signing keys stay outside Git. Public hosting has not been implemented or authorized; it would require a separate assessment of Garmin SDK hosting permissions and an isolated persistent compiler runtime.

## Install on Forerunner 970 with Windows

1. On the watch, select **Watch Settings → System → Advanced → USB Mode → MTP** and connect a USB data cable.
2. In File Explorer, open **Forerunner 970 → Internal Storage → GARMIN → APPS**. Depending on Windows, the storage volume may have a slightly different label.
3. Copy `daily-fr970.prg` into `APPS`. Do not copy the editable JSON or rename it to `.prg`.
4. Let the transfer finish; disconnect safely. From the watch face, hold the **middle-left button**, select **Watch Face**, use **Add New** if needed, find **Daily rhythm** (or the project name), and apply it.
5. If the face fails to appear, confirm the `fr970` target, signed compiler success, destination folder and full `.prg` extension. Check `GARMIN/APPS/LOGS` for a crash log if an IQ error appears.

## Install on Forerunner 970 with Mac

The 970 uses **MTP**; it is not a normal Finder-mounted drive. Garmin lists native macOS file access for these devices as unsupported.

1. Select **Watch Settings → System → Advanced → USB Mode → MTP** and connect with a data cable.
2. Close Garmin Express and other programs that might own the MTP connection.
3. A third-party MTP client such as [OpenMTP](https://openmtp.ganeshrvel.com/) can provide file access. Open the watch's **Internal Storage → GARMIN → APPS** and copy the `.prg` there.
4. Finish the transfer, disconnect, then hold the **middle-left button → Watch Face**, select the new face and apply it.
5. This third-party Mac workflow has not been tested on the user's physical 970. If the MTP client cannot access it, use Windows. Garmin Express/Connect IQ app installation and direct browser transfer are not substitutes for this sideload workflow.

Sources: [970 USB settings](https://www8.garmin.com/manuals/webhelp/GUID-025D75CF-3445-49E1-8D81-1AA74AB4E00F/EN-US/GUID-B6EEC065-0BAB-4A19-8350-A3A9DA44AD1D.html), [Garmin MTP support](https://support.garmin.com/en-US/?faq=CZqibgTHMb0dAYEaj2UiU7), [Garmin signing requirements](https://developer.garmin.com/connect-iq/core-topics/security/), [device reference](https://developer.garmin.com/connect-iq/device-reference/fr970/).

## Validation and remaining hardware check

See [VALIDATION.md](VALIDATION.md) for evidence and exact limits. No physical-watch installation, Windows USB transfer, Mac MTP transfer or battery endurance result is claimed.

On the real watch:

1. Save/export the intended project and build it. Record its SHA-256 and the watch firmware version.
2. Install using the matching computer workflow and confirm the project name appears in the face picker.
3. Compare time (12/24-hour preference), date, steps and battery with the watch's own screens. Walk enough to change steps; wait across a minute transition. Check a midnight/date transition when practical.
4. Let the screen sleep and wake it several times. Enable Always On on the watch. Verify dim time updates and alternates position each minute while asleep, and waking restores the normal layout (or low-battery layout when below the threshold).
5. Check long step counts, late-month dates and all edited coordinates for clipping. Preview warnings are approximate, not a guarantee for every live value or locale.
6. Restart the watch and confirm the face still loads. Check battery consumption over a normal day.
7. If it crashes, keep the exported project, build hash, firmware and `GARMIN/APPS/LOGS` evidence. Switch to a built-in watch face while diagnosing.

Device card artwork uses the user-selected watch cutout, with its baked-in checkerboard removed locally and verified as RGBA transparency over light and dark backgrounds. It is served through Next Image and requires no external image connection.

The reference-inspired design uses a fixed, background-colored header with the app name, shared creation-step indicators, horizontal device cards with an arrow action that expands on hover/focus, and a blue action accent. The light theme retains its ivory foundation; dark mode uses charcoal surfaces. No account or additional device support is implied by the interface.

Project files use the `watchface-project` format identifier with version `1`. Local storage uses `watchface.designs`, `watchface.selectedWatch`, and `watchface.theme`. The tab-local editor pointer uses session storage. Earlier project versions and storage shapes are rejected without modifying the original data.

The current format uses an ordered list of up to 16 elements, with unique IDs, visibility and locking. Supported types: time, date, steps, battery, and static text (up to 40 printable ASCII characters). Hidden elements are omitted from preview and compilation. Locked elements remain visible and compile normally. Layer order is back-to-front; the UI lists the frontmost first. No legacy parser or migration is included.

## Typography

Garmin Native uses the Forerunner 970's RobotoRegular scalable font API. Bundled Roboto, Roboto Condensed, Doto, Pixelify Sans, and Rubik Bubbles use licensed bitmap glyph atlases. Font, available weight, pixel sizes (24–120 in steps of 8), color, and left/center/right alignment are saved per element. X is a reference point: Left places text to its left, Center centers it, and Right places text to its right. Y remains the vertical center. Custom-font preview, bounds, snapping, and compiler resources share glyph metrics and images. Native glyphs are approximated by the bundled Roboto atlas in the browser.

Only visible custom font/weight/size combinations and their required glyph descriptions are packaged. Source exports include the PNG atlases. Font sources, licenses, and regeneration instructions live in assets/fonts/watchface. Font uploads remain out of scope.

Time elements have an explicit 12/24-hour format shared by preview and generated code. The footer follows the selected data layer: time (15-minute steps), date (day steps), steps (100-step increments), and battery (1% increments). Values can also be entered directly and remain separate from the saved design. Display modes show normal samples, the simplified low-battery layout with a 5% sample, or the dim always-on layout used by the generated face. Normal Preview also switches automatically when the sample battery reaches the configured threshold; editing stays on the explicitly selected mode. Simulation values do not modify saved designs or generated code.

Opacity controls are omitted from the editor and color picker. The compiler rejects translucent text until correct blending with underlying layers is implemented and verified.

Text and background colors accept six-digit RGB hex values. The color modal shows the last eight applied colors and offers an inline hue/saturation spectrum and brightness slider, and direct hex input. Apply commits a color; Cancel, Escape, or clicking outside discards it. Recent colors are stored in this browser under watchface.recent-colors. Imported hex colors are validated and normalized to uppercase.

### Device power capabilities

`src/devices/catalog.ts` owns supported power modes and device limits. The footer, settings, preview, and Garmin generator use these capabilities. Forerunner 970 supports both modes. Under Background → Power modes, set the low-battery threshold from 1–30% (default 10%). The optional `power.lowBatteryThreshold` project setting is autosaved and exported with the design; omitted settings use the device default.

Always-on starts with a time-only layout using native 48 px gray text on black and can be customized. Its 180 × 64 clipping rectangle covers less than 10% of the circular display and alternates between two non-overlapping positions each minute. Display-off remains black. Low battery activates its saved layout at or below the threshold, and restores the normal design above it. This is watch-face behavior, separate from Garmin’s system Battery Saver. Both automatic layouts preserve the first visible time layer’s 12/24-hour format; they use 24-hour time when none exists.

Hardware checks remain: verify wrist-down always-on and wrist-up recovery across several minutes; verify the simplified face at/below the chosen threshold and recovery after charging above it; check extended always-on use for display warnings and actual battery consumption. Simulator checks do not establish real-watch battery life or long-term display behavior.

### Editing power layouts

Select Normal, Always-on, or Low battery in the footer to edit that mode’s layers. Selection, add/duplicate/delete/reorder, visibility, locking, typography, positions, drag, and keyboard nudging operate on the active layout. Mode layouts are saved under `layouts` and included in project export/import and undo/redo. Each layout supports up to 16 layers; the project limit is 1.5 MB.

Unedited modes start with time-only (always-on) and time/battery (low battery) defaults. Always-on requires black outside its 180 × 64 drawing area, outlined in the editor. Layer anchors stay within this area; oversized glyphs are clipped in both browser and Garmin output. Colors and custom fonts are supported inside the area. Editing uses the upper position; Preview simulates its alternating minute position. Low battery allows a custom background and all supported layer types.

While editing, the selected mode stays active regardless of sample battery. Preview applies automatic battery-threshold switching when Normal is selected, matching runtime behavior. The generator includes fonts and data fields from every layout. Verify your customized layouts in the simulator and on the real watch before relying on them.

### Additional layers

Use **Add** to choose health/activity data, progress, shapes, icons, or an image.
Use **Variant** in the right inspector for alternate presentations. Ring/bar values
use the configured goal; a Progress layer also lets you choose the data source.
Health readings use Garmin's current or latest recorded data, not continuous sensor
sampling. Weather uses Garmin's cached current conditions; it may be unavailable
until the watch has synced. Missing text readings show `--`; missing progress is empty.
Distance is currently kilometers and temperature Celsius.

Images stay in the editable project, with no external URL dependency. Upload PNG,
JPEG or WebP up to 5 MB; the editor reduces it to at most the device display resolution (454 × 454 on Forerunner 970) and stores PNG.
An empty visible image layer must receive an image before building. The project
limit is 1.5 MB, with a combined 1 MB encoded-image budget across layouts.

For targeted real-compiler checks:
`WATCHFACE_FIXTURES=metrics,graphics npm run test:builds`

Image rendering: smooth resampling by default; the Pixel variant uses nearest-neighbor scaling in both browser and compiler. Per-image encoded data is limited to 350,000 characters, combined image data to 1 MiB, and project JSON to 1.5 MiB. Panda uses shared vector dial geometry instead of a bitmap.
