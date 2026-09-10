import { DesignLibrary } from "@/components/library/DesignLibrary";
export const metadata = {
  title: "My designs · Watchface Studio",
  robots: { index: false, follow: false },
};
export default function DesignsPage() {
  return <DesignLibrary />;
}
