import { Button } from "@/components/ui";
import { PlusIcon, SuggestionIcon } from "@/icons";
import { ruleSummary } from "@/watchface/rules";
import type { RuleSuggestion } from "@/watchface/rule-suggestions";
import { InspectorSection } from "./InspectorSection";

export function RuleSuggestions({
  suggestions,
  disabled,
  onAdd,
}: {
  suggestions: RuleSuggestion[];
  disabled: boolean;
  onAdd: (id: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <InspectorSection
      defaultOpen
      title={
        <span className="watchface-suggestion-title">
          <SuggestionIcon size="sm" />
          Suggestions ({suggestions.length})
        </span>
      }
    >
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="watchface-rule-suggestion">
          <div className="u-grid gap1">
            <strong className="u-font-xs">{suggestion.label}</strong>
            <p className="u-font-xs u-text-secondary">
              {ruleSummary(suggestion.rule)}
            </p>
          </div>
          <div className="watchface-rule-suggestion__action">
            <span className="watchface-rule-suggestion__color u-font-xs u-text-secondary">
              <svg className="u-icon-sm" aria-hidden="true" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill={suggestion.rule.color} />
              </svg>
              {suggestion.rule.color}
            </span>
            <Button
              size="xs"
              variant="ghost"
              disabled={disabled}
              aria-label={`Add ${suggestion.label} rule`}
              onClick={() => onAdd(suggestion.id)}
            >
              <PlusIcon size="xs" /> Add
            </Button>
          </div>
        </div>
      ))}
    </InspectorSection>
  );
}
