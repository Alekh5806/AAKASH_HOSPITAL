import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ButtonLink({
  children,
  href,
  to,
  variant = "primary",
  icon: Icon = ArrowRight,
  className = "",
  ...props
}) {
  const classes = `button-link button-link--${variant} ${className}`.trim();
  const content = (
    <>
      <span>{children}</span>
      {Icon ? <Icon aria-hidden="true" size={18} strokeWidth={2.2} /> : null}
    </>
  );

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} to={to} {...props}>
      {content}
    </Link>
  );
}
