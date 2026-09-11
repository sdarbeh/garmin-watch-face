import { ChevronRightIcon } from "@/icons";

export function InstallationGuide({
  step,
  platform,
}: {
  step: "transfer" | "apply";
  platform: "windows" | "mac";
}) {
  if (step === "apply")
    return (
      <section aria-labelledby="export-step-title">
        <h3 id="export-step-title" className="u-font-lg u-weight-semibold mb3">
          Make it your watch face
        </h3>
        <ol className="watchface-export__instructions">
          <li>
            Wait until the file transfer finishes, then disconnect your watch.
          </li>
          <li>
            From the watch face, hold the middle-left button to open the menu.
            Choose <strong>Watch Face</strong>.
          </li>
          <li>
            Find your new face, select it, and choose <strong>Apply</strong>.
          </li>
        </ol>
        <p className="u-font-sm u-text-secondary mt4">
          Check the live values, then let the screen sleep and wake it again to
          try your always-on layout.
        </p>
        <details className="ui-disclosure mt4">
          <summary>
            Face not showing up?
            <ChevronRightIcon size="xxs" strokeWidth="3" />
          </summary>
          <p>
            Check that the .prg was copied into GARMIN/APPS on the selected
            watch and the transfer completed. Reconnect and retry the transfer
            if needed. If the watch shows an IQ error, return to the editor and
            rebuild.
          </p>
        </details>
      </section>
    );
  return (
    <section aria-labelledby="export-step-title">
      <h3 id="export-step-title" className="u-font-lg u-weight-semibold mb3">
        Copy the file to your watch
      </h3>
      <ol className="watchface-export__instructions">
        <li>
          Connect your watch with a USB data cable. On the watch, set{" "}
          <strong>System → Advanced → USB Mode</strong> to <strong>MTP</strong>.
        </li>
        <li>
          {platform === "windows" ? (
            <>
              In File Explorer, open your watch, then{" "}
              <strong>Internal Storage</strong>.
            </>
          ) : (
            <>
              Close Garmin Express and other transfer apps. Open your watch in
              an MTP file-transfer app, then open{" "}
              <strong>Internal Storage</strong>. The watch won’t appear as a
              normal Finder disk.
            </>
          )}
        </li>
        <li>
          Open <code>GARMIN/APPS</code> and copy the downloaded{" "}
          <strong>.prg</strong> file into it.
        </li>
      </ol>
      <details className="ui-disclosure mt4">
        <summary>
          Watch not connecting?
          <ChevronRightIcon size="xxs" strokeWidth="3" />
        </summary>
        <p>
          Try a data-capable cable rather than a charging-only cable, confirm
          MTP mode, and close other apps accessing the watch. On Mac, use an MTP
          client; if it cannot access the watch, try the Windows instructions.
        </p>
      </details>
    </section>
  );
}
