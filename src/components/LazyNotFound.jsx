import { lazy, Suspense } from "react";

const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

/* The not-found page, as a hospital, doctor or service page shows it for a
   slug that names nothing. Loaded on demand rather than imported, because a
   page's static imports carry their stylesheets with them: imported, the
   not-found sheet would be linked, render-blocking, on every one of those
   pages. Such a slug is never prerendered - the host answers it with
   404.html - so this only ever renders in the browser, where Vite fetches the
   sheet before the module resolves and the page is styled the frame it
   appears. */
export default function LazyNotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundPage />
    </Suspense>
  );
}
