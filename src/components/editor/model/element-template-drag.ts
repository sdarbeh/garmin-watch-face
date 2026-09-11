export const ELEMENT_TEMPLATE_DRAG_TYPE =
  "application/x-watchface-element-template";

export function writeElementTemplateDrag(
  dataTransfer: DataTransfer,
  templateId: string,
) {
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(ELEMENT_TEMPLATE_DRAG_TYPE, templateId);
}

export function hasElementTemplateDrag(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes(ELEMENT_TEMPLATE_DRAG_TYPE);
}

export function readElementTemplateDrag(dataTransfer: DataTransfer) {
  return dataTransfer.getData(ELEMENT_TEMPLATE_DRAG_TYPE).trim();
}
