"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { WatchPickerModal } from "@/components/devices/WatchPickerModal";
import { getDeviceById, type Device } from "@/devices/catalog";
import { getPreset } from "@/presets/catalog";
import {
  newDesignSession,
  newDesignSource,
} from "@/library/new-design-session";
import { browserLibrary } from "@/library/store";
import { useLibrary } from "@/library/useLibrary";
export function StartDesignButton({
  presetSlug,
  watchId,
  children = "Create a watch face",
  variant = "secondary",
  className,
}: {
  presetSlug?: string;
  watchId?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const library = useLibrary();
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const preset = presetSlug ? getPreset(presetSlug) : undefined;
  const watch = getDeviceById(watchId ?? library.selectedWatch ?? "");
  const target =
    watch?.supported && (!preset || preset.compatibleDevices.includes(watch.id))
      ? watch
      : undefined;
  function href(watch: Device) {
    return `/editor/new?${new URLSearchParams({
      ...(preset ? { preset: preset.slug } : {}),
      watch: watch.slug,
    })}`;
  }
  function prepare(watch: Device) {
    browserLibrary.selectWatch(watch.id);
    newDesignSession.begin(newDesignSource(watch.id, preset?.slug));
  }
  function select(watch: Device) {
    prepare(watch);
    setChoosing(false);
    router.push(href(watch));
  }
  return (
    <>
      {target ? (
        <Button
          href={href(target)}
          onNavigate={() => prepare(target)}
          size="sm"
          variant={variant}
          className={className}
        >
          {children}
        </Button>
      ) : (
        <Button
          size="sm"
          variant={variant}
          className={className}
          disabled={!library.ready}
          aria-haspopup="dialog"
          onClick={() => setChoosing(true)}
        >
          {children}
        </Button>
      )}
      {choosing && (
        <WatchPickerModal
          selectionAction="Customize for"
          preset={preset}
          onSelect={select}
          onClose={() => setChoosing(false)}
        />
      )}
    </>
  );
}
