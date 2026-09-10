import { getPreset } from "@/presets/catalog";
import { notFound } from "next/navigation";
import { DevicePicker } from "@/components/devices/DevicePicker";
export const metadata = { title: "Supported watches · Watchface Studio" };
export default async function WatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; create?: string }>;
}) {
  const source = await searchParams;
  const preset =
    typeof source.preset === "string" ? getPreset(source.preset) : undefined;
  if (source.preset && !preset) notFound();
  return <DevicePicker preset={preset} create={source.create === "1"} />;
}
