import { Home } from "lucide-react";
import ButtonLink from "../components/ButtonLink";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { site } from "../lib/coreData";

export default function NotFoundPage() {
  return (
    <>
      <SEO meta={site.pageSeo.notFound} />
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="The page may have moved, or the link may no longer be available."
      />
      <section className="section">
        <div className="container">
          <ButtonLink to="/" icon={Home}>
            Go Home
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

