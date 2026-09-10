import { DEVICE, validateImage } from "@/watchface/schema";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { UploadIcon } from "@/icons";

export function ImageField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (image: { image: string; width: number; height: number }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error("Choose a PNG, JPEG, or WebP under 5 MB.");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        DEVICE.width / bitmap.width,
        DEVICE.height / bitmap.height,
      );
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      try {
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      } finally {
        bitmap.close();
      }
      const image = canvas.toDataURL("image/png");
      validateImage(image);
      if (mounted.current)
        onChange({
          image,
          width: Math.max(8, canvas.width),
          height: Math.max(8, canvas.height),
        });
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error ? cause.message : "Unable to load image.",
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  const action = value ? "Change image" : "Upload image";
  return (
    <div className="u-grid gap2 mb3">
      <div className="u-flex u-items-center gap3">
        {value && (
          <Image
            className="watchface-image-thumbnail"
            src={value}
            alt="Saved layer image"
            width={128}
            height={128}
            unoptimized
          />
        )}
        <Button
          size="sm"
          disabled={disabled || loading}
          onClick={() => input.current?.click()}
        >
          <UploadIcon size="sm" />
          {loading ? "Loading image…" : action}
        </Button>
      </div>
      <input
        ref={input}
        className="u-hidden"
        type="file"
        aria-label="Choose image file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled || loading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void upload(file);
        }}
      />
      <p className="u-font-xs u-text-secondary">
        {value
          ? "Image saved in your project."
          : `PNG, JPEG or WebP · Up to 5 MB. Up to ${DEVICE.width} × ${DEVICE.height} px; encoded PNG up to 256 KB.`}
      </p>
      {error && (
        <p role="alert" className="u-font-xs u-text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
