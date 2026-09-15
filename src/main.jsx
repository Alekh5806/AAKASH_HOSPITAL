import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./styles/global.css";
import "./styles/system.css";
import "./styles/preloader.css";
import "./styles/header.css";
import "./styles/landing.css";
import "./styles/about.css";
import "./styles/services.css";
import "./styles/service-detail.css";
import "./styles/branch.css";
import "./styles/hospitals.css";
import "./styles/contact.css";
import "./styles/appointment.css";
import "./styles/footer.css";
import "./styles/cookie.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
