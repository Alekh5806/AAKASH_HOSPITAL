import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router-dom";
import { branches } from "./lib/coreData";
import { hasBranchPage } from "./lib/contact";
import { profiles } from "./lib/doctorsData";
import { SITE_URL, HeadCollectorContext } from "./lib/seo";
import { services } from "./lib/servicesData";
import { routes } from "./router";

export { SITE_URL, headHtml } from "./lib/seo";
/* The path the not-found page is rendered at - the page itself reads it too. */
export { NOT_FOUND_PATH } from "./lib/notFoundData";

/* The build-time half of the site: scripts/prerender.mjs imports this (built
   by `vite build --ssr`) and writes every page below as static HTML, so a
   search engine, a social preview or a reader without JavaScript gets the
   whole page and its head in the first response. Nothing here runs in a
   browser. */

const handler = createStaticHandler(routes);

/* Every indexable page, derived from the data, so a new service or a new
   hospital page is prerendered and listed in the sitemap without anyone
   touching this list. `kind` lets the prerender group the source files that
   date each page. */
export function getPages() {
  return [
    { path: "/", kind: "home" },
    { path: "/about/journey", kind: "journey" },
    { path: "/about/vision", kind: "vision" },
    { path: "/services", kind: "services" },
    ...services.items.map((service) => ({ path: `/services/${service.slug}`, kind: "service" })),
    { path: "/doctors", kind: "doctors" },
    ...profiles.map((doctor) => ({ path: `/doctors/${doctor.slug}`, kind: "doctor" })),
    { path: "/branches", kind: "branches" },
    ...branches.items
      .filter(hasBranchPage)
      .map((branch) => ({ path: `/branches/${branch.slug}`, kind: "branch" })),
    { path: "/appointment", kind: "appointment" },
    { path: "/contact", kind: "contact" },
  ];
}

export async function render(path) {
  const context = await handler.query(new Request(new URL(path, SITE_URL)));

  if (context instanceof Response) {
    return { redirect: context.headers.get("Location"), status: context.status };
  }

  let head = null;
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <StrictMode>
      <HeadCollectorContext.Provider value={(value) => (head = value)}>
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </HeadCollectorContext.Provider>
    </StrictMode>,
  );

  return { html, head, status: context.statusCode };
}
