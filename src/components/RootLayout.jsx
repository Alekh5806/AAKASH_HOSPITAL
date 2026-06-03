import { motion, useReducedMotion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import QuickActions from "./QuickActions";
import ThemeTokens from "./ThemeTokens";

export default function RootLayout() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <ThemeTokens />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <motion.main
        id="main-content"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
      >
        <Outlet />
      </motion.main>
      <QuickActions />
      <Footer />
    </>
  );
}
