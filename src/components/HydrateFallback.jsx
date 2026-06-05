import { site } from "../lib/coreData";

export default function HydrateFallback() {
  return (
    <section className="route-fallback" aria-label="Loading page">
      <div className="route-fallback__pulse" aria-hidden="true">
        <img src={site.brand.logo} alt="" />
      </div>
      <span>Preparing care experience</span>
    </section>
  );
}
