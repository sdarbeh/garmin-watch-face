import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { PlusIcon, WarningIcon } from "@/icons";
import type { PowerMode } from "@/watchface/power";
import {
  supportedMetrics,
  type CapabilityDevice,
} from "@/watchface/capabilities";
import {
  MAX_APPEARANCE_RULES,
  canRecolor,
  reorderRules,
  ruleConflicts,
} from "@/watchface/rules";
import {
  createAppearanceRule,
  elementRuleSource,
} from "@/watchface/rule-recipes";
import {
  addRuleSuggestion,
  ruleSuggestionsFor,
} from "@/watchface/rule-suggestions";
import type { Metric } from "@/watchface/layer-catalog";
import { presentation, type FaceElement } from "@/watchface/schema";
import type { Simulation } from "@/components/editor/model/simulation";
import { AppearanceRuleEditor } from "./AppearanceRuleEditor";
import { InspectorSection } from "./InspectorSection";
import { RuleSuggestions } from "./RuleSuggestions";

const FALLBACK_RULE_SOURCES: Metric[] = ["battery", "steps", "heartRate"];

function preferredRuleSource(
  contextualSource: Metric | null,
  sources: Metric[],
) {
  if (contextualSource && sources.includes(contextualSource))
    return contextualSource;
  return (
    FALLBACK_RULE_SOURCES.find((source) => sources.includes(source)) ??
    sources[0]
  );
}

export function AppearanceRules({
  element,
  device,
  mode,
  disabled,
  onChange,
  simulation,
  onSimulationChange,
}: {
  element: FaceElement;
  device: CapabilityDevice;
  mode: PowerMode;
  disabled: boolean;
  onChange: (patch: Partial<FaceElement>) => void;
  simulation: Simulation;
  onSimulationChange: (value: Simulation) => void;
}) {
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(null);
  const pendingFocus = useRef<number | null>(null);
  const ruleHeaders = useRef<(HTMLButtonElement | null)[]>([]);
  const addCustomButton = useRef<HTMLButtonElement>(null);
  const rules = element.rules ?? [];
  useEffect(() => {
    const index = pendingFocus.current;
    if (index === null) return;
    pendingFocus.current = null;
    const header = ruleHeaders.current[index] ?? addCustomButton.current;
    header?.focus({ preventScroll: true });
    header?.scrollIntoView({ block: "nearest" });
  }, [element.rules]);
  const recolor = canRecolor(element.type, presentation(element).variant);
  const sources = supportedMetrics(device);
  const contextualSource = elementRuleSource(element);
  const defaultSource = preferredRuleSource(contextualSource, sources);
  const suggestions = ruleSuggestionsFor(element, device, mode);
  const conflicts = ruleConflicts(rules);
  const updateRules = (nextRules: NonNullable<FaceElement["rules"]>) =>
    onChange({ rules: nextRules });

  return (
    <InspectorSection
      title={`Rules${rules.length ? ` (${rules.length})` : ""}`}
    >
      <p className="u-font-xs u-text-secondary mb3">
        Change this layer based on watch data. Rules run top to bottom; the last
        matching color wins, and Hide always wins. Missing data keeps the base
        appearance.
      </p>
      <RuleSuggestions
        suggestions={suggestions}
        disabled={disabled}
        onAdd={(id) => {
          if (disabled) return;
          const addition = addRuleSuggestion(element, device, mode, id);
          if (!addition) return;
          pendingFocus.current = addition.index;
          setOpenRuleIndex(addition.index);
          updateRules(addition.rules);
        }}
      />
      {conflicts.length > 0 && (
        <div className="watchface-rule-conflicts" role="status">
          <p className="watchface-rule-conflicts__title u-font-xs u-weight-medium">
            <WarningIcon size="sm" />
            Check rule priority
          </p>
          {conflicts.map((conflict) => (
            <p
              key={`${conflict.first}-${conflict.second}-${conflict.kind}`}
              className="u-font-xs"
            >
              Rules {conflict.first + 1} and {conflict.second + 1}{" "}
              {conflict.kind === "duplicate"
                ? "use the same condition."
                : `can both match; rule ${conflict.second + 1} wins.`}
            </p>
          ))}
        </div>
      )}
      {rules.map((rule, index) => (
        <AppearanceRuleEditor
          key={index}
          rule={rule}
          index={index}
          rules={rules}
          sources={sources}
          recolor={recolor}
          mode={mode}
          disabled={disabled}
          simulation={simulation}
          open={openRuleIndex === index}
          summaryRef={(header) => {
            ruleHeaders.current[index] = header;
          }}
          onRulesChange={updateRules}
          onOpenChange={(open) =>
            setOpenRuleIndex((current) => {
              if (open) return index;
              return current === index ? null : current;
            })
          }
          onMove={(to) => {
            pendingFocus.current = to;
            setOpenRuleIndex(to);
            updateRules(reorderRules(rules, index, to));
          }}
          onRemove={() => {
            const nextRules = rules.filter(
              (_, ruleIndex) => ruleIndex !== index,
            );
            setOpenRuleIndex(null);
            pendingFocus.current = nextRules.length
              ? Math.min(index, nextRules.length - 1)
              : null;
            updateRules(nextRules);
          }}
          onSimulationChange={onSimulationChange}
        />
      ))}
      {rules.length < MAX_APPEARANCE_RULES ? (
        <Button
          ref={addCustomButton}
          size="sm"
          variant="ghost"
          disabled={disabled || !defaultSource}
          onClick={() => {
            if (!defaultSource) return;
            pendingFocus.current = rules.length;
            setOpenRuleIndex(rules.length);
            updateRules([
              ...rules,
              createAppearanceRule(defaultSource, recolor, mode),
            ]);
          }}
        >
          <PlusIcon size="sm" />
          Add custom rule
        </Button>
      ) : (
        <p className="u-font-xs u-text-secondary" role="status">
          Maximum of {MAX_APPEARANCE_RULES} rules reached.
        </p>
      )}
    </InspectorSection>
  );
}
