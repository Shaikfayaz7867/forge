import {
  Activity,
  CalendarDays,
  ClipboardList,
  History,
  LayoutGrid,
  Library,
  NotebookText,
  PersonStanding,
  Settings,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/workouts", label: "Workouts", icon: Activity },
  { href: "/exercises", label: "Exercises", icon: Library },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/body", label: "Body", icon: PersonStanding },
  { href: "/plans", label: "Plans", icon: ClipboardList },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/review", label: "Weekly Review", icon: NotebookText },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Mobile bottom bar: four destinations around a central quick-add button. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: LayoutGrid },
  { href: "/workouts", label: "Train", icon: Activity },
  { href: "/nutrition", label: "Eat", icon: Utensils },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];
