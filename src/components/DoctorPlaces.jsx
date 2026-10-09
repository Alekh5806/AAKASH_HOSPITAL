import { Fragment } from "react";
import { Link } from "react-router-dom";
import { branches } from "../lib/coreData";
import { buildBranchHref } from "../lib/contact";

const BY_NAME = new Map(branches.items.map((branch) => [branch.name, branch]));

/* A doctor card's foot - "Sees patients at Visnagar and Gota" - with each
   hospital's name the way into that hospital's page (getDoctorPlaces in
   lib/doctorsData.js builds the lines). */
export default function DoctorPlaces({ lines }) {
  return lines.map((parts) => (
    <p key={parts.map((part) => part.text ?? part.hospital).join("")}>
      {parts.map((part, index) => {
        const branch = part.hospital ? BY_NAME.get(part.hospital) : null;
        return (
          <Fragment key={index}>
            {branch ? (
              <Link to={buildBranchHref(branch)}>{part.hospital}</Link>
            ) : (
              (part.text ?? part.hospital)
            )}
          </Fragment>
        );
      })}
    </p>
  ));
}
