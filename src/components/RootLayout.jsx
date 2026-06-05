import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppPreloader from "./AppPreloader";
import CookieConsent from "./CookieConsent";
import Footer from "./Footer";
import Header from "./Header";
import QuickActions from "./QuickActions";
import ThemeTokens from "./ThemeTokens";

function RouteScrollManager() {
  const { hash, pathname, search } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));

        if (target) {
          target.scrollIntoView();
          return;
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname, search]);

  return null;
}

export default function RootLayout() {
  return (
    <>
      <ThemeTokens />
      <AppPreloader />
      <RouteScrollManager />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <QuickActions />
      <Footer />
      <CookieConsent />
    </>
  );
}
