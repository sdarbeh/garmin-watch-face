import { notFound } from "next/navigation";
import { defaultDesign, designForDevice } from "@/watchface/schema";
import { getPreset } from "@/presets/catalog";
import { getDeviceBySlug } from "@/devices/catalog";
import { ProjectEditor } from "@/components/editor/ProjectEditor";
export const metadata = {
  title: "Design editor · Watchface Studio",
  robots: { index: false, follow: false },
};
export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ watch?: string; preset?: string }>;
}) {
  const { id } = await params;
  const source = await searchParams;
  const preset =
    typeof source.preset === "string" ? getPreset(source.preset) : undefined;
  const watch =
    typeof source.watch === "string"
      ? getDeviceBySlug(source.watch)
      : undefined;
  let initialDesign;
  if (
    id === "new" &&
    watch?.supported &&
    (!source.preset || preset?.compatibleDevices.includes(watch.id))
  ) {
    initialDesign = preset
      ? designForDevice(preset.design, watch.id)
      : defaultDesign(watch.id);
  }
  if (id === "new" && !initialDesign) notFound();
  return (
    <ProjectEditor
      id={id}
      initialDesign={initialDesign}
      presetSlug={preset?.slug}
    />
  );
}
