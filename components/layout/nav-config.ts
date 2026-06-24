import {
  LayoutDashboard,
  Code2,
  Brain,
  Map,
  RefreshCw,
  LineChart,
  GraduationCap,
  BookOpen,
  Library,
  Network,
  Settings,
  Activity,
  Bell,
  Compass,
  Heart,
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
    items: [
      { label: "Overview", shortLabel: "Home", href: "/overview", icon: LayoutDashboard },
      { label: "Notifications", shortLabel: "Alerts", href: "/notifications", icon: Bell },
    ],
  },
  {
    heading: "Learning",
    items: [
      { label: "Problems", shortLabel: "Problems", href: "/problems", icon: Code2 },
      { label: "Revision", shortLabel: "Revision", href: "/revision", icon: RefreshCw },
      { label: "Roadmaps", shortLabel: "Roadmaps", href: "/roadmaps", icon: Map },
    ],
  },
  {
    heading: "Knowledge",
    items: [
      { label: "Knowledge OS", shortLabel: "Knowledge", href: "/knowledge", icon: Compass },
      { label: "Concepts", shortLabel: "Concepts", href: "/concepts", icon: Brain },
      { label: "Knowledge Vault", shortLabel: "Vault", href: "/vault", icon: Library },
      { label: "Taxonomy", shortLabel: "Taxonomy", href: "/taxonomy", icon: Network },
    ],
  },
  {
    heading: "Growth",
    items: [
      { label: "Analytics", shortLabel: "Stats", href: "/analytics", icon: LineChart },
      { label: "Timeline", shortLabel: "Timeline", href: "/timeline", icon: Activity },
    ],
  },
  {
    heading: "Academic",
    items: [
      { label: "Academic Command Center", shortLabel: "Academic", href: "/academic", icon: GraduationCap },
      { label: "IIT Workspace", shortLabel: "IIT", href: "/iit-workspace", icon: BookOpen },
    ],
  },
  {
    heading: "Personal",
    items: [
      // Relationships/Family/Sleep/Exercise/Priorities are reminder
      // categories with no dedicated page — this deep-links into
      // Notifications pre-filtered to just those, since that's the only
      // place they're actually manageable today.
      { label: "Personal", shortLabel: "Personal", href: "/notifications?life=personal", icon: Heart },
    ],
  },
  {
    items: [{ label: "Settings", shortLabel: "Settings", href: "/settings", icon: Settings }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Reduced set for the mobile bottom navigation (4 + center FAB). Looked up by
 * href rather than position so inserting nav items elsewhere can't silently
 * shift this list onto the wrong pages. */
const MOBILE_NAV_HREFS = ["/overview", "/problems", "/revision", "/analytics"];
export const MOBILE_NAV: NavItem[] = MOBILE_NAV_HREFS.map(
  (href) => NAV_ITEMS.find((item) => item.href === href)!,
);
