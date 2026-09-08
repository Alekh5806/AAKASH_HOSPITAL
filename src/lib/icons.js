import {
  Activity,
  CalendarCheck2,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const icons = {
  Activity,
  CalendarCheck2,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
};

export function getIcon(name) {
  return icons[name] ?? CircleHelp;
}
