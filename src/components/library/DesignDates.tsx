import type { SavedDesign } from "@/library/store";

export function DesignDates({ project }: { project: SavedDesign }) {
  const date = (value: string) => (
    <time dateTime={value} title={new Date(value).toLocaleString()}>
      {new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}
    </time>
  );
  return (
    <span>
      Edited {date(project.updatedAt)}
      {project.downloadedAt && <> · Downloaded {date(project.downloadedAt)}</>}
    </span>
  );
}
