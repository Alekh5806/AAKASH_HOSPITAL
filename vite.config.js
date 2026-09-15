import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import site from "./src/data/site.json" with { type: "json" };
import { splitTagline } from "./src/lib/brand.js";

/* The opening curtain's static first frame in index.html carries the wordmark
   and the tagline before any script runs; they come from site.json here so
   the brand is written once. */
function brandHtml() {
  const [taglineLead, taglineSince] = splitTagline(site.brand.tagline);
  const fills = {
    "%BRAND_LOGO%": site.brand.logo,
    "%BRAND_TAGLINE_LEAD%": taglineLead,
    "%BRAND_TAGLINE_SINCE%": taglineSince,
  };

  return {
    name: "aakash-brand-html",
    transformIndexHtml(html) {
      return Object.entries(fills).reduce(
        (output, [token, value]) => output.replaceAll(token, value),
        html,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), brandHtml()],
  server: {
    // Bind to every interface so a real phone on the same Wi-Fi can open the
    // Network URL that `npm run dev` prints. Dev only; does not affect builds.
    host: true,
  },
  build: {
    sourcemap: false,
  },
});
