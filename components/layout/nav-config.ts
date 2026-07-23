import {
  LayoutDashboard,
  Code2,
  Brain,
  LineChart,
  GraduationCap,
  BookOpen,
  Library,
  Database,
  RefreshCw,
  Map,
  Settings,
  Activity,
  Bell,
  Compass,
  FolderKanban,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  Target,
  Lightbulb,
  Timer,
  Sparkles,
  Mic,
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
    heading: "Your OS",
    items: [
      { label: "Home", shortLabel: "Home", href: "/overview", icon: LayoutDashboard },
      { label: "Voice OS", shortLabel: "Voice", href: "/voice", icon: Mic },
      { label: "Plan", shortLabel: "Plan", href: "/execution", icon: Target },
      { label: "Review", shortLabel: "Review", href: "/timeline", icon: Activity },
      { label: "Focus Timer", shortLabel: "Focus", href: "/focus", icon: Timer },
      { label: "Personal Coach", shortLabel: "Coach", href: "/coach", icon: Sparkles },
    ],
  },
  {
    heading: "Work",
    items: [
      { label: "Projects", shortLabel: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Business", shortLabel: "Business", href: "/business", icon: TrendingUp },
      { label: "Finance", shortLabel: "Finance", href: "/finance", icon: Wallet },
      { label: "Invoices", shortLabel: "Invoices", href: "/invoices", icon: Receipt },
    ],
  },
  {
    heading: "Learn",
    items: [
      { label: "Academic", shortLabel: "Academic", href: "/academic", icon: GraduationCap },
      { label: "IIT Workspace", shortLabel: "IIT", href: "/iit-workspace", icon: BookOpen },
      { label: "DSA", shortLabel: "DSA", href: "/problems", icon: Code2 },
      { label: "Knowledge", shortLabel: "Knowledge", href: "/knowledge", icon: Compass },
      { label: "Interests", shortLabel: "Interests", href: "/interests", icon: Lightbulb },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Insights", shortLabel: "Insights", href: "/analytics", icon: LineChart },
      { label: "Alerts", shortLabel: "Alerts", href: "/notifications", icon: Bell },
      { label: "Settings", shortLabel: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const COMMAND_NAV_ITEMS: NavItem[] = [
  ...NAV_ITEMS,
  { label: "Clients", shortLabel: "Clients", href: "/clients", icon: Users },
  { label: "Pipeline", shortLabel: "Pipeline", href: "/pipeline", icon: Target },
  { label: "Invoices", shortLabel: "Invoices", href: "/invoices", icon: Receipt },
  { label: "IIT workspace", shortLabel: "IIT", href: "/iit-workspace", icon: BookOpen },
  { label: "Concepts", shortLabel: "Concepts", href: "/concepts", icon: Brain },
  { label: "Vault", shortLabel: "Vault", href: "/vault", icon: Library },
  { label: "Resources", shortLabel: "Resources", href: "/resources", icon: Database },
  { label: "Revision", shortLabel: "Revision", href: "/revision", icon: RefreshCw },
  { label: "Roadmaps", shortLabel: "Roadmaps", href: "/roadmaps", icon: Map },
  { label: "Focus Timer", shortLabel: "Focus", href: "/focus", icon: Timer },
  { label: "Personal Coach", shortLabel: "Coach", href: "/coach", icon: Sparkles },
];

const MOBILE_NAV_HREFS = ["/overview", "/execution", "/projects", "/academic"];
export const MOBILE_NAV: NavItem[] = MOBILE_NAV_HREFS.map(
  (href) => NAV_ITEMS.find((item) => item.href === href)!,
);
