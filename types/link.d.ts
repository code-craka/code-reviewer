/**
 * Type declarations for link-related functionality
 */

declare module "next/link" {
  import { LinkProps as NextLinkProps } from "next/dist/client/link";
  import React from "react";

  type LinkProps = Omit<NextLinkProps, "as" | "passHref" | "prefetch"> & {
    children?: React.ReactNode;
    prefetch?: boolean;
    className?: string;
    style?: React.CSSProperties;
  };

  export default function Link(props: LinkProps): React.ReactElement;
}

// Additional global type declarations
declare global {
  interface Window {
    // Add any browser-specific globals here
    supabase?: unknown;
  }
}
