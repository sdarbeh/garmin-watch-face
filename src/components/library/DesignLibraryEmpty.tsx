import { FacePreview } from "@/components/presets/FacePreview";
import { getPreset } from "@/presets/catalog";
import { Button } from "@/components/ui";
import { StartDesignButton } from "./StartDesignButton";

export function DesignLibraryEmpty() {
  return (
    <div className="design-library-empty">
      <div className="design-library-empty__faces" aria-hidden="true">
        {["summit", "simple", "vital-rings"].map((slug) => (
          <div key={slug} className="design-library-empty__face">
            <FacePreview design={getPreset(slug)!.design} />
          </div>
        ))}
      </div>
      <h2 className="design-library-empty__title">
        Create your first watch face
      </h2>
      <p className="u-font-md u-text-secondary">
        Start with a preset or build one from scratch for your watch.
      </p>
      <div className="design-library-empty__actions">
        <StartDesignButton variant="primary">
          Create from scratch
        </StartDesignButton>
        <Button href="/presets" size="sm">
          Browse presets
        </Button>
      </div>
    </div>
  );
}
