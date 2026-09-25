import { useState } from "react";
import { STAGE_PILL_CLASS, STAGES, type Stage } from "../data/mock";
import { useT } from "../i18n/context";
import { IconChevronDown } from "./icons";

export function StageSelect({
  name = "stage",
  value,
  defaultValue = "spark",
  onChange,
  id,
  autoSubmit = false,
}: {
  name?: string;
  value?: Stage;
  defaultValue?: Stage;
  onChange?: (stage: Stage) => void;
  id?: string;
  autoSubmit?: boolean;
}) {
  const t = useT();
  const [internal, setInternal] = useState<Stage>(value ?? defaultValue);
  const current = value ?? internal;
  return (
    <label className="relative inline-flex">
      <span className={`stage-pill pointer-events-none ${STAGE_PILL_CLASS[current]}`}>
        {t.common.stage[current]}
        <IconChevronDown className="ml-0.5 h-3 w-3" />
      </span>
      <select
        id={id}
        name={name}
        {...(value !== undefined ? { value } : { defaultValue })}
        onChange={(event) => {
          const next = event.target.value as Stage;
          setInternal(next);
          onChange?.(next);
          if (autoSubmit) event.currentTarget.form?.requestSubmit();
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={t.idea.edit.stage}
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {t.common.stage[stage]}
          </option>
        ))}
      </select>
    </label>
  );
}
