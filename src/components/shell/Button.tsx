import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The only two button styles. Primary is ink on ground; secondary is a hairline outline.
 * 40px tall, 8px radius, 16px sides. The round record button and the top-bar pill are the exceptions.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-btn whitespace-nowrap disabled:opacity-40";
const SIZE = {
  regular: "h-10 px-4 text-sm",
  small: "h-8 px-3 text-xs",
} as const;
const STYLE = {
  primary: "bg-ink text-ground",
  secondary: "border border-hairline hover:border-secondary",
} as const;

type Variant = keyof typeof STYLE;
type Size = keyof typeof SIZE;

export function Button({
  variant = "secondary",
  size = "regular",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...props} className={`${BASE} ${SIZE[size]} ${STYLE[variant]} ${className}`} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "regular",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={`${BASE} ${SIZE[size]} ${STYLE[variant]} ${className}`} />;
}
