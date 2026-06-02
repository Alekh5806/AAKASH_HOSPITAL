import {
  Activity,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const icons = {
  Activity,
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Stethoscope,
};

export function getIcon(name) {
  return icons[name] ?? CircleHelp;
}
