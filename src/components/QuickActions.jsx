import { CalendarDays, MapPinned, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { branches } from "../lib/coreData";

function cleanTel(number) {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

export default function QuickActions() {
  const primaryBranch = branches.items.find((branch) => branch.isHeadquarters) ?? branches.items[0];
  const primaryPhone =
    primaryBranch.phoneGroups.find((group) => group.label.toLowerCase().includes("opd"))
      ?.numbers[0] ??
    primaryBranch.phoneGroups[0]?.numbers[0] ??
    "";

  return (
    <nav className="quick-actions" aria-label="Quick patient actions">
      <Link to="/appointment">
        <CalendarDays size={18} aria-hidden="true" />
        <span>Book</span>
      </Link>
      <a href={`tel:${cleanTel(primaryPhone)}`}>
        <Phone size={18} aria-hidden="true" />
        <span>Call</span>
      </a>
      <a
        href={`https://wa.me/${primaryBranch.whatsappNumber}?text=${encodeURIComponent(
          "Hello Aakash Eye Hospital, I would like to book an appointment.",
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span>WhatsApp</span>
      </a>
      <Link to="/branches">
        <MapPinned size={18} aria-hidden="true" />
        <span>Branches</span>
      </Link>
    </nav>
  );
}
