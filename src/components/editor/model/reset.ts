import type { SavedDesign } from "@/library/store";
import { defaultDesign, type Design } from "@/watchface/schema";

/** Create a blank starter face without changing the project's watch. */
export function baseDesignForProject(
  project: Pick<SavedDesign, "design">,
): Design {
  return { ...defaultDesign(project.design.device), elements: [] };
}
