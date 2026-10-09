import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { splitTagline } from "./src/lib/brand.js";

const readProjectFile = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function readAttribute(tag, name) {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

/* The curtain moves the logo's three parts separately - the blue square, the
   white mark inside it and the name beside it - so the logo is split here
   rather than drawn twice. The square becomes the mark's box (its colour and
   proportions), and the name's viewBox starts where the square ends. */
function splitLogo(svg) {
  const square = /<rect\b[^>]*>/.exec(svg)?.[0];
  const paths = svg.match(/<path\b[^>]*\/>/g) ?? [];
  const mark = paths.find((path) => /fill="#fff(fff)?"/i.test(path));
  const name = paths.filter((path) => path !== mark);
  const viewBox = readAttribute(svg, "viewBox")?.split(/\s+/).map(Number);
  if (!square || !mark || !name.length || !viewBox) {
    throw new Error(
      "logo.svg is no longer a square, a white mark and a name; update splitLogo() in vite.config.js",
    );
  }

  const [x, y, width, height] = ["x", "y", "width", "height"].map((key) =>
    Number(readAttribute(square, key)),
  );
  const right = viewBox[0] + viewBox[2];
  return {
    fill: readAttribute(square, "fill"),
    markBox: `${x} ${y} ${width} ${height}`,
    markRatio: `${width} / ${height}`,
    mark,
    nameBox: `${x + width} ${y} ${right - x - width} ${height}`,
    name: name.join(""),
    ratio: `${right - x} / ${height}`,
  };
}

/* Comments and indentation go; the newlines and spaces a value depends on
   (`calc(a - b)`) stay as single spaces. */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};])\s*/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/;}/g, "}")
    .trim();
}

/* The opening curtain is static HTML in index.html - it has to paint before
   any script - so its stylesheet, the split logo and the tagline are filled
   in here from preloader.css, the logo file and site.json. Read on every
   transform, so an edit shows on the next reload of the dev server. */
function curtainHtml() {
  return {
    name: "aakash-curtain-html",
    transformIndexHtml(html) {
      // Read rather than `import ... with { type: "json" }`: wrangler parses
      // this file before a deploy and its parser rejects import attributes.
      const site = JSON.parse(readProjectFile("./src/data/site.json"));
      const [taglineLead, taglineSince] = splitTagline(site.brand.tagline);
      const logo = splitLogo(readProjectFile(`./public${site.brand.logo}`));
      const fills = {
        "%PL_CSS%": minifyCss(readProjectFile("./src/styles/preloader.css")),
        "%FONT_CSS%": minifyCss(readProjectFile("./src/styles/fonts.css")),
        "%PL_NAME_LABEL%": site.brand.name,
        "%PL_RATIO%": logo.ratio,
        "%PL_MARK_FILL%": logo.fill,
        "%PL_MARK_RATIO%": logo.markRatio,
        "%PL_MARK_BOX%": logo.markBox,
        "%PL_MARK%": logo.mark,
        "%PL_NAME_BOX%": logo.nameBox,
        "%PL_NAME%": logo.name,
        "%BRAND_LOGO%": site.brand.logo,
        "%BRAND_TAGLINE_LEAD%": taglineLead,
        "%BRAND_TAGLINE_SINCE%": taglineSince,
      };

      return Object.entries(fills).reduce(
        (output, [token, value]) => output.replaceAll(token, () => value),
        html,
      );
    },
  };
}

/* A shader is imported as its source text. The comments that explain it stay
   in src/lib/*.frag and never reach a reader's phone: every line is trimmed
   and the comments dropped, which halves what the eye model ships. Newlines
   are kept, because a #define ends at one. */
function glslSource() {
  return {
    name: "aakash-glsl-source",
    load(id) {
      if (!id.endsWith(".frag")) return null;
      const source = readFileSync(id, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
      return `export default ${JSON.stringify(source)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), curtainHtml(), glslSource()],
  // The year the prerendered copy prints (see useCurrentYear in
  // src/lib/hydration.js); the app and the renderer are built back to back,
  // so both read the same one.
  define: {
    "import.meta.env.BUILD_YEAR": JSON.stringify(String(new Date().getFullYear())),
  },
  server: {
    // Bind to every interface so a real phone on the same Wi-Fi can open the
    // Network URL that `npm run dev` prints. Dev only; does not affect builds.
    host: true,
  },
  build: {
    sourcemap: false,
    // Fingerprinted bundles get a folder of their own, so the host can cache
    // them for a year without also freezing the photographs in /assets/media.
    assetsDir: "assets/app",
    // Which CSS and JS each page's module needs, read by scripts/prerender.mjs
    // to link a page's own stylesheet in its HTML (and deleted afterwards).
    manifest: true,
  },
});
