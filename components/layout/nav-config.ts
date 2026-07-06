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
  Database,
  Network,
  Settings,
  Activity,
  Bell,
  Compass,
  Heart,
  FolderKanban,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  Target,
  MessageSquarePlus,
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
    heading: "Mission Control",
    items: [
      { label: "Overview", shortLabel: "Home", href: "/overview", icon: LayoutDashboard },
      { label: "Timeline", shortLabel: "Timeline", href: "/timeline", icon: Activity },
      { label: "Notifications", shortLabel: "Alerts", href: "/notifications", icon: Bell },
    ],
  },
  {
    heading: "Business Workspace",
    items: [
      { label: "Business Hub", shortLabel: "Hub", href: "/business", icon: TrendingUp },
      { label: "Clients", shortLabel: "Clients", href: "/clients", icon: Users },
      { label: "Pipeline", shortLabel: "Pipeline", href: "/pipeline", icon: Target },
      { label: "Finance & Invoices", shortLabel: "Finance", href: "/finance", icon: Wallet },
    ],
  },
  {
    heading: "Projects Workspace",
    items: [
      { label: "All Projects", shortLabel: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    heading: "Academic Workspace",
    items: [
      { label: "Command Center", shortLabel: "Academic", href: "/academic", icon: GraduationCap },
      { label: "IIT Degree", shortLabel: "IIT", href: "/iit-workspace", icon: BookOpen },
    ],
  },
  {
    heading: "Knowledge Base",
    items: [
      { label: "Knowledge OS", shortLabel: "Knowledge", href: "/knowledge", icon: Compass },
      { label: "Concepts & Taxonomy", shortLabel: "Concepts", href: "/concepts", icon: Brain },
      { label: "Vault", shortLabel: "Vault", href: "/vault", icon: Library },
      { label: "Resources", shortLabel: "Resources", href: "/resources", icon: Database },
    ],
  },
  {
    heading: "Execution",
    items: [
      { label: "Daily Planner", shortLabel: "Planner", href: "/execution", icon: Target },
      { label: "Problem Solving", shortLabel: "Problems", href: "/problems", icon: Code2 },
      { label: "Revision", shortLabel: "Revision", href: "/revision", icon: RefreshCw },
    ],
  },
  {
    heading: "Analytics",
    items: [
      { label: "Analytics OS", shortLabel: "Stats", href: "/analytics", icon: LineChart },
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
