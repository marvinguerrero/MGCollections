import {
  LayoutDashboard,
  Library,
  HandCoins,
  Bell,
  Settings,
  Calendar,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Core modules only — Bookshelves is intentionally not here. It's now a
 * display mode inside Collection (see app/(dashboard)/collection/page.tsx),
 * not a primary destination, per the "reduce navigation, prioritize search"
 * architecture goal. The /bookshelves/[id] detail route itself is unchanged.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/loans", label: "Loans", icon: HandCoins },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Subset shown in the mobile bottom tab bar; the rest live behind "More". */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/loans", label: "Loans", icon: HandCoins },
];
