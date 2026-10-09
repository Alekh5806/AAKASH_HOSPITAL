import { branches } from "../lib/coreData";
import {
  ORGANIZATION_ID,
  branchId,
  doctorNode,
  faqNodes,
  hospitalNode,
  itemList,
  pageGraph,
  ref,
  serviceId,
  serviceNode,
  serviceReference,
} from "../lib/schema";

/* One <script> per page carrying the page's whole @graph (see lib/schema.js).
   "<" is escaped so a string in the data can never close the script early. */
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

const HOME = { name: "Home", href: "/" };

export function HomeJsonLd({ meta }) {
  return (
    <JsonLd
      data={pageGraph({
        path: "/",
        meta,
        about: ref(ORGANIZATION_ID),
        nodes: branches.items.map((branch) => hospitalNode(branch)),
      })}
    />
  );
}

/* The two About pages, the appointment page and anything else that is about
   the network as a whole. */
export function PageJsonLd({ path, meta, types, crumbs }) {
  return (
    <JsonLd
      data={pageGraph({ path, meta, types, about: ref(ORGANIZATION_ID), crumbs: [HOME, ...crumbs] })}
    />
  );
}

export function ServicesJsonLd({ meta, services }) {
  return (
    <JsonLd
      data={pageGraph({
        path: "/services",
        meta,
        types: ["CollectionPage"],
        about: ref(ORGANIZATION_ID),
        mainEntity: itemList(services.map(serviceReference)),
        crumbs: [HOME, { name: "Services", href: "/services" }],
      })}
    />
  );
}

export function ServiceJsonLd({ service, part }) {
  const path = `/services/${service.slug}`;
  const questions = faqNodes(path, service.faq);
  return (
    <JsonLd
      data={pageGraph({
        path,
        meta: service.seo,
        types: questions.length ? ["MedicalWebPage", "FAQPage"] : ["MedicalWebPage"],
        about: ref(serviceId(service)),
        mainEntity: questions.length ? questions.map((question) => ref(question["@id"])) : undefined,
        image: service.image,
        review: service.review,
        crumbs: [HOME, { name: "Services", href: "/services" }, { name: service.title, href: path }],
        nodes: [serviceNode(service, { part }), ...questions],
      })}
    />
  );
}

export function DoctorsJsonLd({ meta, doctors, isOptometrist }) {
  const people = doctors.map((doctor) => doctorNode(doctor, { optometrist: isOptometrist(doctor) }));
  return (
    <JsonLd
      data={pageGraph({
        path: "/doctors",
        meta,
        types: ["CollectionPage"],
        about: ref(ORGANIZATION_ID),
        mainEntity: itemList(people.map((person) => ref(person["@id"]))),
        crumbs: [HOME, { name: "Doctors", href: "/doctors" }],
        nodes: people,
      })}
    />
  );
}

/* One doctor's page: a ProfilePage about the doctor, with the treatments the
   page lists and the hospitals they practise at (referenced by @id). */
export function DoctorJsonLd({ doctor, meta, services }) {
  const path = `/doctors/${doctor.slug}`;
  const person = doctorNode(doctor, { services });
  return (
    <JsonLd
      data={pageGraph({
        path,
        meta,
        types: ["ProfilePage"],
        about: ref(person["@id"]),
        mainEntity: ref(person["@id"]),
        image: doctor.photo,
        crumbs: [HOME, { name: "Doctors", href: "/doctors" }, { name: doctor.name, href: path }],
        nodes: [person],
      })}
    />
  );
}

export function BranchesJsonLd({ meta }) {
  return (
    <JsonLd
      data={pageGraph({
        path: "/branches",
        meta,
        types: ["CollectionPage"],
        about: ref(ORGANIZATION_ID),
        mainEntity: itemList(branches.items.map((branch) => ref(branchId(branch)))),
        crumbs: [HOME, { name: "Our Hospitals", href: "/branches" }],
        nodes: branches.items.map((branch) => hospitalNode(branch)),
      })}
    />
  );
}

/* One hospital's page: the hospital, everything it offers, and the people who
   see patients there - the same three things the page shows. */
export function BranchJsonLd({ branch, services, team, isOptometrist }) {
  const path = `/branches/${branch.slug}`;
  const people = team
    ? [...team.doctors, ...team.visiting, ...team.optometrists].map((doctor) =>
        doctorNode(doctor, { optometrist: isOptometrist(doctor) }),
      )
    : [];
  return (
    <JsonLd
      data={pageGraph({
        path,
        meta: branch.page.seo,
        about: ref(branchId(branch)),
        mainEntity: ref(branchId(branch)),
        image: branch.page.image,
        crumbs: [HOME, { name: "Our Hospitals", href: "/branches" }, { name: branch.name, href: path }],
        nodes: [hospitalNode(branch, { services }), ...people],
      })}
    />
  );
}

export function ContactJsonLd({ meta }) {
  return (
    <JsonLd
      data={pageGraph({
        path: "/contact",
        meta,
        types: ["ContactPage"],
        about: ref(ORGANIZATION_ID),
        crumbs: [HOME, { name: "Contact", href: "/contact" }],
        nodes: branches.items.map((branch) => hospitalNode(branch)),
      })}
    />
  );
}
