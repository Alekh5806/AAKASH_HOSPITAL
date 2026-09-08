import { NavLink } from "react-router-dom";
import { navigation } from "../lib/coreData";

const aboutNav = navigation.header.find((item) => item.dropdown === "about");

/* The header dropdown is how a reader picks between the two About pages, but on
   a phone that dropdown lives inside the drawer. This keeps the same choice on
   the page itself, so moving between the journey and the vision is one tap. */
export default function AboutSwitch() {
  const options = aboutNav?.children ?? [];

  if (options.length < 2) return null;

  return (
    <nav className="ab-switch" aria-label="About us pages">
      {options.map((option) => (
        <NavLink
          key={option.href}
          className={({ isActive }) => `ab-switch__item ${isActive ? "ab-switch__item--on" : ""}`}
          to={option.href}
        >
          <strong>{option.label}</strong>
          <small>{option.description}</small>
        </NavLink>
      ))}
    </nav>
  );
}
