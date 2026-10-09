import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SCROLL_DRIVEN } from "./lib/motion";
import { routes } from "./router";
/* The stylesheets every page needs: the base, the design system, the parts of
   the layout on every route, and two components several pages share and too
   small to be worth a request of their own. Each page imports its own
   namespaced sheet, so a page loads only the CSS it uses - see "Stylesheets
   per page" in CLAUDE.md. */
import "./styles/global.css";
import "./styles/system.css";
import "./styles/header.css";
import "./styles/footer.css";
import "./styles/cookie.css";
import "./styles/count-up.css";
import "./styles/branch-status.css";

const router = createBrowserRouter(routes);
const container = document.getElementById("root");

/* Every page arrives as prerendered HTML (scripts/prerender.mjs), under the
   opening curtain or, later in the visit, the paper veil index.html paints.
   React waits for the route's own module before its first render, so that
   render is the page itself. */
function routeReady() {
  if (router.state.initialized) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = router.subscribe((state) => {
      if (!state.initialized) return;
      unsubscribe();
      resolve();
    });
  });
}

/* Parameters a link can carry that no page reads. */
const UNREAD_PARAM = /^(utm_\w+|gclid|gbraid|wbraid|fbclid|msclkid)$/;

/* React adopts the prerendered copy - the elements already on screen become
   the app's, so nothing is painted twice and the first paint stays the page's
   largest - only where its first pass is certain to match the build: the copy
   is this page's (a host can answer an unknown path with another page's
   file), and the browser is the one the build assumed (motion allowed,
   scroll-driven animation understood) with no query string a page reads.
   Everywhere else React builds the page fresh over the copy, as it always
   did; either way the reader sees the same page. */
function canAdopt() {
  if (container.dataset.path !== window.location.pathname) return false;
  if (!SCROLL_DRIVEN) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  for (const key of new URLSearchParams(window.location.search).keys()) {
    if (!UNREAD_PARAM.test(key)) return false;
  }
  return true;
}

/* The prerendered copy is the finished page, so the prerender took each
   entrance's starting pose out of it and kept it beside it; React's first
   pass renders those poses, so they go back first - under the curtain or the
   veil, where nobody sees the page settle into them. */
function restoreStartingPoses() {
  for (const element of container.querySelectorAll("[data-ssr-style]")) {
    element.setAttribute("style", element.getAttribute("data-ssr-style"));
    element.removeAttribute("data-ssr-style");
  }
}

routeReady().then(() => {
  const app = (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );

  if (canAdopt()) {
    restoreStartingPoses();
    /* Whatever the reader's own values change as React takes over - their
       hospital, the hours right now - lands in its final state, as a fresh
       build of the page would; AppPreloader lifts this once it has. */
    document.documentElement.classList.add("app-adopting");
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
});
