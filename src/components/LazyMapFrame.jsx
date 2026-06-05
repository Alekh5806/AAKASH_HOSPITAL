import { useEffect, useRef, useState } from "react";

export default function LazyMapFrame({ title, src, className = "" }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (shouldLoad) return undefined;
    const target = frameRef.current;
    if (!target || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoad]);

  if (shouldLoad) {
    return (
      <iframe
        className={className}
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    );
  }

  return (
    <button
      ref={frameRef}
      className={`lazy-map-frame ${className}`}
      type="button"
      onClick={() => setShouldLoad(true)}
    >
      <span>Map preview</span>
      <strong>{title}</strong>
      <em>Load interactive map</em>
    </button>
  );
}
