import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "h-4 w-4"}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconList(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconMerge(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7" cy="6" r="2.25" />
      <circle cx="7" cy="18" r="2.25" />
      <circle cx="17" cy="12" r="2.25" />
      <path d="M7 8.25v7.5M9.2 7.2c2.4.9 4.3 2.4 5.5 4.8M9.2 16.8c2.4-.9 4.3-2.4 5.5-4.8" />
    </Svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.2 16.2 21 21" />
    </Svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.25" />
      <path d="M16 19a4.8 4.8 0 0 0 4.5-5" />
    </Svg>
  );
}

export function IconColumns(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M9.5 4.5v15M14.5 4.5v15" />
    </Svg>
  );
}

export function IconKey(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="14" r="4" />
      <path d="M11.5 12.5 20 4.5M16.5 4.5h3.5V8" />
    </Svg>
  );
}
