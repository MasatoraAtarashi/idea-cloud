import { useState } from "react";
import {
  CATEGORY_FIELD_LABEL,
  CATEGORY_NAME_PLACEHOLDER,
  type IdeaCategory,
} from "../lib/category";

/** Optional category as chips. Tap the selected chip again to clear. */
export function CategoryField({
  categories,
  defaultId = null,
  disabled = false,
  idPrefix,
}: {
  categories: IdeaCategory[];
  defaultId?: number | null;
  disabled?: boolean;
  idPrefix: string;
}) {
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [categoryId, setCategoryId] = useState(defaultId ? String(defaultId) : "");
  const [name, setName] = useState("");
  const nameId = `${idPrefix}-category-name`;

  return (
    <div
      role="group"
      aria-label={CATEGORY_FIELD_LABEL}
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      <input type="hidden" name="categoryId" value={mode === "new" ? "" : categoryId} />
      {categories.map((category) => {
        const on = mode === "pick" && categoryId === String(category.id);
        return (
          <button
            key={category.id}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => {
              setMode("pick");
              setCategoryId(on ? "" : String(category.id));
            }}
            className={`flex min-h-11 items-center rounded-[8px] border px-3.5 text-[13px] md:min-h-[34px] ${
              on
                ? "border-foreground bg-foreground font-semibold text-white"
                : "border-border-control bg-card text-secondary hover:bg-sunken"
            }`}
          >
            {category.name}
          </button>
        );
      })}
      {mode === "new" ? (
        <span className="flex min-w-[10rem] flex-1 items-center gap-1">
          <label htmlFor={nameId} className="sr-only">
            {CATEGORY_NAME_PLACEHOLDER}
          </label>
          <input
            id={nameId}
            name="categoryName"
            value={name}
            disabled={disabled}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            placeholder={CATEGORY_NAME_PLACEHOLDER}
            className="min-h-11 min-w-0 flex-1 rounded-[8px] border border-dashed border-border-control bg-card px-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground md:min-h-[34px]"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMode("pick");
              setName("");
            }}
            className="min-h-11 px-1.5 text-[12.5px] text-muted-foreground hover:text-foreground md:min-h-[34px]"
          >
            やめる
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode("new")}
          className="flex min-h-11 items-center rounded-[8px] border border-dashed border-border-control px-3.5 text-[13px] text-muted-foreground hover:text-foreground md:min-h-[34px]"
        >
          ＋ 新しいカテゴリ
        </button>
      )}
    </div>
  );
}

export function CategoryLabel({ name }: { name?: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex max-w-full items-center truncate text-[12px] text-muted-foreground">
      {name}
    </span>
  );
}
