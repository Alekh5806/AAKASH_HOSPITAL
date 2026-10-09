import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HeadCollectorContext, applyHead, buildHead } from "../lib/seo";

export default function SEO({ meta }) {
  const { pathname } = useLocation();
  const collect = useContext(HeadCollectorContext);
  const head = buildHead(meta, pathname);
  const key = JSON.stringify(head);

  collect?.(head);

  useEffect(() => {
    applyHead(JSON.parse(key));
  }, [key]);

  return null;
}
