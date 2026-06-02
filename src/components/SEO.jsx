import { useEffect } from "react";
import { getSeo } from "../lib/data";

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
    const url = resolved.url || window.location.href;
    const image = resolved.image ? new URL(resolved.image, window.location.origin).toString() : "";

    document.title = resolved.title;
    setMeta("name", "description", resolved.description);
    setMeta("property", "og:title", resolved.title);
    setMeta("property", "og:description", resolved.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", resolved.title);
    setMeta("name", "twitter:description", resolved.description);
    setMeta("name", "twitter:image", image);
    setCanonical(url);
  }, [meta]);

  return null;
}
