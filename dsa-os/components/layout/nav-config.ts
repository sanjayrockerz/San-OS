import {
  LayoutDashboard,
  Code2,
  Brain,
  Map,
  RefreshCw,
  LineChart,
  GraduationCap,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      { label: "Overview", shortLabel: "Home", href: "/overview", icon: LayoutDashboard },
      { label: "Problems", shortLabel: "Problems", href: "/problems", icon: Code2 },
      { label: "Concepts", shortLabel: "Concepts", href: "/concepts", icon: Brain },
      { label: "Roadmaps", shortLabel: "Roadmaps", href: "/roadmaps", icon: Map },
      { label: "Revision", shortLabel: "Revision", href: "/revision", icon: RefreshCw },
      { label: "Analytics", shortLabel: "Stats", href: "/analytics", icon: LineChart },
    ],
  },
  {
    heading: "Study",
    items: [
      { label: "IIT Workspace", shortLabel: "IIT", href: "/iit-workspace", icon: GraduationCap },
      { label: "Knowledge Vault", shortLabel: "Vault", href: "/knowledge-vault", icon: Library },
    ],
  },
  {
    items: [{ label: "Settings", shortLabel: "Settings", href: "/settings", icon: Settings }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Reduced set for the mobile bottom navigation (4 + center FAB). */
export const MOBILE_NAV: NavItem[] = [
  NAV_ITEMS[0], // Overview
  NAV_ITEMS[1], // Problems
  NAV_ITEMS[4], // Revision
  NAV_ITEMS[5], // Analytics
];
