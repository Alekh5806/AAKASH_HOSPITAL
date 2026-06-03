function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

export default function AnimatedCounter({ value, suffix = "" }) {
  return (
    <span>
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
