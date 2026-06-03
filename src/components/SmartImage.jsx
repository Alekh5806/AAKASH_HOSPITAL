export default function SmartImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  sizes = "(min-width: 900px) 45vw, 100vw",
}) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding={loading === "eager" ? "sync" : "async"}
      fetchPriority={loading === "eager" ? "high" : "auto"}
      sizes={sizes}
    />
  );
}
