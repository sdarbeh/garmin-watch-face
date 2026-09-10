import { notFound } from "next/navigation";
import { getPreset, presets } from "@/presets/catalog";
import { PresetDetail } from "@/components/presets/PresetDetail";
export function generateStaticParams() {
  return presets.map((preset) => ({ slug: preset.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `${getPreset(slug)?.name ?? "Preset not found"} · Watchface Studio`,
  };
}
export default async function PresetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preset = getPreset(slug);
  if (!preset) notFound();
  return <PresetDetail preset={preset} />;
}
