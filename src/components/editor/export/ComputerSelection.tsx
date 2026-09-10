import { Button } from "@/components/ui";
import { AppleIcon, WindowsIcon, CheckCircleIcon } from "@/icons";

export type ExportPlatform = "mac" | "windows";

export function detectExportPlatform(): ExportPlatform | null {
  const agent = navigator.userAgent;
  if (/Windows NT/i.test(agent)) return "windows";
  if (/Macintosh/i.test(agent) && navigator.maxTouchPoints <= 1) return "mac";
  return null;
}

export function ComputerSelection({
  platform,
  onChange,
  disabled = false,
}: {
  platform: ExportPlatform | null;
  disabled?: boolean;
  onChange: (platform: ExportPlatform) => void;
}) {
  return (
    <section aria-labelledby="export-step-title">
      <h3 id="export-step-title" className="u-font-lg u-weight-semibold mb2">
        Which computer are you using?
      </h3>
      <p className="u-font-sm u-text-secondary mb4">
        Choose the computer you’ll use to transfer the file to your watch.
      </p>
      <div
        className="watchface-export__computers"
        role="group"
        aria-label="Computer operating system"
      >
        {(["mac", "windows"] as const).map((value) => {
          const Icon = value === "mac" ? AppleIcon : WindowsIcon;
          return (
            <Button
              key={value}
              disabled={disabled}
              className="watchface-export__computer"
              active={platform === value}
              aria-pressed={platform === value}
              onClick={() => onChange(value)}
            >
              <Icon className="watchface-export__computer-icon" />
              {value === "mac" ? "Mac" : "Windows"}
              {platform === value && (
                <CheckCircleIcon
                  className="watchface-export__computer-check"
                  size="sm"
                />
              )}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
