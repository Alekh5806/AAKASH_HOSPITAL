import {
  Activity,
  CalendarCheck2,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

const icons = {
  Activity,
  CalendarCheck2,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
};

export function getIcon(name) {
  return icons[name] ?? CircleHelp;
}
