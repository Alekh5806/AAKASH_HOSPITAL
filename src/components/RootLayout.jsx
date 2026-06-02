import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import ThemeTokens from "./ThemeTokens";

export default function RootLayout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <ThemeTokens />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          key={location.pathname}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
