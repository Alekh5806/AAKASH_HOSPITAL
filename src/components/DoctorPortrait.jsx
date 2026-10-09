import SmartImage from "./SmartImage";
import { getInitials } from "../lib/doctorsData";

/* A doctor's portrait, or - until the hospital supplies one - their initials
 * in the serif on a disc inside a hairline ring.
 *
 * The monogram is SVG so it scales with whatever box holds it, from a 38px
 * face in a stack to a card's square, and fills that box the way the photo's
 * `cover` does. It is `aria-hidden`: the name is always printed beside it.
 * Adding `photo` to the record in doctors.json swaps in the portrait. */
export default function DoctorPortrait({ doctor, className, loading, sizes, decorative = false }) {
  if (doctor.photo) {
    return (
      <SmartImage
        className={className}
        src={doctor.photo}
        alt={decorative ? "" : doctor.name}
        loading={loading}
        sizes={sizes}
      />
    );
  }

  return (
    <svg className="e-monogram" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className="e-monogram__ring" cx="50" cy="50" r="43" />
      <circle className="e-monogram__disc" cx="50" cy="50" r="33" />
      <text className="e-monogram__text" x="50" y="50" dy="0.35em" textAnchor="middle">
        {getInitials(doctor.name)}
      </text>
    </svg>
  );
}
