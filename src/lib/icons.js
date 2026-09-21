import {
  CircleHelp,
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

/* Every glyph a data file can name: the trust tiles (home.json), the two
   statements (about.json) and the cookie categories (site.json). Register a
   name here when a JSON entry starts using it; an unregistered name renders
   the fallback rather than nothing. */
const icons = {
  Eye,
  FolderHeart,
  Gauge,
  Goal,
  HeartHandshake,
  MapPinned,
  ScanEye,
  ShieldCheck,
  Stethoscope,
};

export function getIcon(name) {
  return icons[name] ?? CircleHelp;
}
