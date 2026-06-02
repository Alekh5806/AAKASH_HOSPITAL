import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { home, site } from "../lib/data";
import CTASection from "../sections/CTASection";
import MissionVision from "../sections/MissionVision";
import StatsBand from "../sections/StatsBand";
import Timeline from "../sections/Timeline";

export default function AboutPage() {
  return (
    <>
      <SEO meta={site.pageSeo.about} />
      <PageHeader
        eyebrow="About us"
        title="Built on technology, trust and continuity of care"
        description="Aakash Eye Hospital started in Visnagar in 1993 and has grown into a multi-branch ophthalmic care network across Gujarat."
      />
      <Timeline timeline={home.timeline} />
      <MissionVision data={home.missionVision} />
      <StatsBand stats={home.stats} />
      <CTASection cta={home.cta} />
    </>
  );
}
