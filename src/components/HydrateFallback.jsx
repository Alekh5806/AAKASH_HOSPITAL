export default function HydrateFallback() {
  return (
    <section className="route-fallback" aria-label="Loading page">
      <div className="route-fallback__pulse" aria-hidden="true" />
      <span>Loading</span>
    </section>
  );
}
