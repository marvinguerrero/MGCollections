import {
  LayoutDashboard,
  Library,
  Rows3,
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

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "My Collection", icon: Library },
  { href: "/bookshelves", label: "Bookshelves", icon: Rows3 },
  { href: "/loans", label: "Loans", icon: HandCoins },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Subset shown in the mobile bottom tab bar; the rest live behind "Menu". */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/bookshelves", label: "Shelves", icon: Rows3 },
  { href: "/loans", label: "Loans", icon: HandCoins },
];
