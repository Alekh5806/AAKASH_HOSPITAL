import { BreadcrumbJsonLd } from "../components/JsonLd";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { doctors } from "../lib/doctorsData";
import { home } from "../lib/homeData";
import CTASection from "../sections/CTASection";
import DoctorGrid from "../sections/DoctorGrid";

export default function DoctorsPage() {
  return (
    <>
      <SEO meta={doctors.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Doctors", href: "/doctors" },
        ]}
      />
      <PageHeader
        eyebrow="Doctors"
        title={
          <>
            <span className="page-header__title-line">Eye specialists and</span>
            <span className="page-header__title-line">optometry team</span>
          </>
        }
        description="A multidisciplinary care team supporting diagnosis, surgery, retina care, refraction and follow-up."
        image="/assets/media/page-headers/ophthalmology-exam.jpg"
        variant="doctors"
      />
      <DoctorGrid doctors={doctors.items} title="Clinical team" showAllLink={false} />
      <CTASection cta={home.cta} />
    </>
  );
}
