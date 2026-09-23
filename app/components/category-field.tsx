import { useState } from "react";
import {
  CATEGORY_FIELD_LABEL,
  CATEGORY_NAME_PLACEHOLDER,
  CATEGORY_NEW_LABEL,
  CATEGORY_NONE_LABEL,
  type IdeaCategory,
} from "../lib/category";

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
  const selectId = `${idPrefix}-category`;
  const nameId = `${idPrefix}-category-name`;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <label htmlFor={selectId} className="sr-only">
        {CATEGORY_FIELD_LABEL}
      </label>
      <select
        id={selectId}
        name="categoryId"
        value={mode === "new" ? "" : categoryId}
        disabled={disabled || mode === "new"}
        onChange={(event) => setCategoryId(event.target.value)}
        className="h-11 min-w-[8.5rem] rounded-full border border-border-control bg-card px-3 text-[13px] text-foreground outline-none md:h-8 md:text-[12.5px]"
      >
        <option value="">{CATEGORY_NONE_LABEL}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {mode === "new" ? (
        <>
          <label htmlFor={nameId} className="sr-only">
            {CATEGORY_NAME_PLACEHOLDER}
          </label>
          <input
            id={nameId}
            name="categoryName"
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
            placeholder={CATEGORY_NAME_PLACEHOLDER}
            className="h-11 min-w-[8.5rem] flex-1 rounded-full border border-dashed border-border-control bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground md:h-8 md:text-[12.5px]"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMode("pick");
              setName("");
            }}
            className="min-h-11 px-1 text-[12.5px] text-muted-foreground md:min-h-8"
          >
            やめる
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode("new")}
          className="min-h-11 rounded-full px-2 text-[12.5px] text-muted-foreground hover:text-foreground md:min-h-8"
        >
          {CATEGORY_NEW_LABEL}
        </button>
      )}
    </div>
  );
}

export function CategoryLabel({ name }: { name?: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-full border border-border-control px-2 py-0.5 text-[11px] text-foreground">
      {name}
    </span>
  );
}
