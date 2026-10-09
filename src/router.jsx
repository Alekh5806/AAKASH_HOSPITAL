import { redirect } from "react-router-dom";
import RootLayout from "./components/RootLayout";

/* The route table, shared by the browser (main.jsx builds a browser router
   from it) and the prerender (entry-server.jsx renders every page from it at
   build time), so the two can never disagree about what a URL shows. */
function lazyPage(loader) {
  return async () => {
    const module = await loader();
    return { Component: module.default };
  };
}

export const routes = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("./pages/HomePage.jsx")),
      },
      {
        // A real 301 on the server (src/data/redirects.json); this covers an
        // in-app link to it.
        path: "about",
        loader: () => redirect("/about/journey"),
      },
      {
        path: "about/journey",
        lazy: lazyPage(() => import("./pages/AboutJourneyPage.jsx")),
      },
      {
        path: "about/vision",
        lazy: lazyPage(() => import("./pages/AboutVisionPage.jsx")),
      },
      {
        path: "services",
        lazy: lazyPage(() => import("./pages/ServicesPage.jsx")),
      },
      {
        path: "services/:slug",
        lazy: lazyPage(() => import("./pages/ServiceDetailPage.jsx")),
      },
      {
        path: "doctors",
        lazy: lazyPage(() => import("./pages/DoctorsPage.jsx")),
      },
      {
        path: "doctors/:slug",
        lazy: lazyPage(() => import("./pages/DoctorProfilePage.jsx")),
      },
      {
        path: "branches",
        lazy: lazyPage(() => import("./pages/BranchesPage.jsx")),
      },
      {
        path: "branches/:slug",
        lazy: lazyPage(() => import("./pages/BranchPage.jsx")),
      },
      {
        path: "appointment",
        lazy: lazyPage(() => import("./pages/AppointmentPage.jsx")),
      },
      {
        path: "contact",
        lazy: lazyPage(() => import("./pages/ContactPage.jsx")),
      },
      {
        path: "*",
        lazy: lazyPage(() => import("./pages/NotFoundPage.jsx")),
      },
    ],
  },
];
