import { Switch } from "@/components/ui";
import { LockIcon, VisibilityIcon } from "@/icons";
import { InspectorSection } from "./InspectorSection";

export function LayerStateSettings({
  visible,
  visibilityMixed = false,
  locked,
  lockMixed = false,
  ready,
  onVisibilityChange,
  onLockChange,
}: {
  visible: boolean;
  visibilityMixed?: boolean;
  locked: boolean;
  lockMixed?: boolean;
  ready: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onLockChange: (locked: boolean) => void;
}) {
  return (
    <InspectorSection title="Layer state">
      <Switch
        label={
          <span className="watchface-switch-label">
            <VisibilityIcon visible={visible} size="sm" />
            Visible
          </span>
        }
        checked={visible}
        indeterminate={visibilityMixed}
        disabled={!ready || locked || lockMixed}
        onCheckedChange={onVisibilityChange}
      />
      <Switch
        label={
          <span className="watchface-switch-label">
            <LockIcon locked={locked || lockMixed} size="sm" />
            Locked
          </span>
        }
        checked={locked}
        indeterminate={lockMixed}
        disabled={!ready}
        onCheckedChange={onLockChange}
      />
    </InspectorSection>
  );
}
