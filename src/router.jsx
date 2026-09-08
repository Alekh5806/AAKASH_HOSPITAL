import { createBrowserRouter, Navigate } from "react-router-dom";
import HydrateFallback from "./components/HydrateFallback";
import RootLayout from "./components/RootLayout";

function lazyPage(loader) {
  return async () => {
    const module = await loader();
    return { Component: module.default, HydrateFallback };
  };
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    HydrateFallback,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("./pages/HomePage.jsx")),
      },
      {
        path: "about",
        element: <Navigate to="/about/journey" replace />,
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
        path: "branches",
        lazy: lazyPage(() => import("./pages/BranchesPage.jsx")),
      },
      {
        path: "gallery",
        lazy: lazyPage(() => import("./pages/GalleryPage.jsx")),
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
]);

export default router;
