"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Device } from "@/devices/catalog";
import { Button } from "@/components/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayerIcon,
  PlusIcon,
  SearchIcon,
} from "@/icons";
import {
  ELEMENT_TEMPLATE_CATEGORIES,
  searchElementTemplates,
  templatesForDevice,
  type ElementTemplateCategoryId,
} from "@/components/editor/model/element-templates";
import { writeElementTemplateDrag } from "@/components/editor/model/element-template-drag";
import { ElementTemplatePreview } from "./ElementTemplatePreview";

export function AddElementsScreen({
  device,
  disabled,
  onAdd,
  onBack,
}: {
  device: Device;
  disabled: boolean;
  onAdd: (templateId: string) => void;
  onBack: () => void;
}) {
  const titleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] =
    useState<ElementTemplateCategoryId | null>(null);
  const available = useMemo(() => templatesForDevice(device), [device]);
  const matches = searchElementTemplates(available, query).filter(
    (template) => !categoryId || template.category === categoryId,
  );
  const category = ELEMENT_TEMPLATE_CATEGORIES.find(
    (item) => item.id === categoryId,
  );
  const categories = ELEMENT_TEMPLATE_CATEGORIES.filter((item) =>
    available.some((template) => template.category === item.id),
  );
  const showCategories = !query && !category;

  useEffect(() => {
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  function goBack() {
    if (query) {
      setQuery("");
      return;
    }
    if (category) {
      setCategoryId(null);
      return;
    }
    onBack();
  }

  return (
    <section
      className="watchface-left-rail__screen"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        goBack();
      }}
    >
      <div className="watchface-add-elements__header u-flex u-items-center gap2">
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={
            category || query ? "Back to element groups" : "Back to layers"
          }
          onClick={goBack}
        >
          <ChevronLeftIcon size="sm" />
        </Button>
        <h2 id={titleId} className="u-font-md u-weight-bold">
          {category?.label ?? "Add element"}
        </h2>
      </div>

      <div className="watchface-left-rail__scroll watchface-add-elements__content u-grid gap3">
        {!category && (
          <label className="ui-search">
            <span className="u-sr-only">Search elements</span>
            <SearchIcon size="sm" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search elements"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                if (nextQuery) setCategoryId(null);
              }}
            />
          </label>
        )}

        <div className="u-grid gap2">
          {showCategories && (
            <p className="u-font-xs u-weight-semibold u-uppercase u-text-secondary">
              Elements
            </p>
          )}
          {showCategories &&
            categories.map((item) => (
              <Button
                key={item.id}
                className="watchface-add-elements__category u-w-full u-justify-start u-ring"
                variant="secondary"
                size="md"
                onClick={() => setCategoryId(item.id)}
              >
                <LayerIcon type={item.icon} size="sm" />
                <span className="u-flex-1 u-text-left">{item.label}</span>
                <ChevronRightIcon size="sm" />
              </Button>
            ))}

          {!showCategories &&
            matches.map((template) => (
              <Button
                key={template.id}
                className="watchface-add-elements__template"
                variant="ghost"
                size="md"
                disabled={disabled}
                draggable={!disabled}
                title="Click to add, or drag onto the watch face"
                onDragStart={(event) =>
                  writeElementTemplateDrag(event.dataTransfer, template.id)
                }
                onClick={() => onAdd(template.id)}
              >
                <ElementTemplatePreview template={template} />
                <span className="watchface-add-elements__template-copy">
                  <span className="u-font-sm u-weight-semibold">
                    {template.label}
                  </span>
                  <span className="u-font-xs u-text-secondary">
                    {template.description}
                  </span>
                </span>
                <PlusIcon size="sm" />
              </Button>
            ))}

          {!showCategories && matches.length === 0 && (
            <p className="u-font-xs u-text-secondary p2" role="status">
              No elements match “{query}”.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
