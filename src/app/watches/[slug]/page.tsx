import { notFound } from "next/navigation";
import { getDeviceBySlug, devices } from "@/devices/catalog";
import { WatchDetail } from "@/components/devices/WatchDetail";
export function generateStaticParams() {
  return devices
    .filter((device) => device.supported)
    .map((device) => ({ slug: device.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `${getDeviceBySlug(slug)?.name ?? "Watch not found"} · Watchface Studio`,
  };
}
export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const device = getDeviceBySlug(slug);
  if (!device?.supported) notFound();
  return <WatchDetail device={device} />;
}
