import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="studio-page u-grid gap4">
      <h1 className="u-font-3xl u-weight-semibold">Page not found</h1>
      <p className="u-text-secondary">
        This watch, preset, or editor link is unavailable. Choose a starting
        point below.
      </p>
      <div className="u-flex u-flex-wrap gap2">
        <Button href="/watches" variant="primary" size="sm">
          Choose a watch
        </Button>
        <Button href="/presets" size="sm">
          Browse presets
        </Button>
      </div>
    </section>
  );
}
