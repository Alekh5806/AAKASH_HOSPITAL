import { useEffect } from "react";
import { getSeo, site } from "../lib/coreData";

function setMeta(attribute, key, content) {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(url) {
  if (!url) return;
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

export default function SEO({ meta }) {
  useEffect(() => {
    const resolved = getSeo(meta);
    const siteUrl = site.defaultSeo.url.replace(/\/$/, "");
    const path =
      window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/$/, "");
    const url = resolved.url ? new URL(resolved.url, siteUrl).toString() : `${siteUrl}${path}`;
    const image = resolved.image ? new URL(resolved.image, siteUrl).toString() : "";

    document.title = resolved.title;
    setMeta("name", "description", resolved.description);
    setMeta("name", "robots", resolved.robots || "index, follow, max-image-preview:large");
    setMeta("property", "og:title", resolved.title);
    setMeta("property", "og:description", resolved.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", site.brand.name);
    setMeta("property", "og:locale", "en_IN");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", resolved.title);
    setMeta("name", "twitter:description", resolved.description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:url", url);
    setCanonical(url);
  }, [meta]);

  return null;
}
