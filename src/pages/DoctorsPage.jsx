import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { doctors, home } from "../lib/data";
import CTASection from "../sections/CTASection";
import DoctorGrid from "../sections/DoctorGrid";

export default function DoctorsPage() {
  return (
    <>
      <SEO meta={doctors.seo} />
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
      <DoctorGrid doctors={doctors.items} title="Clinical team" />
      <CTASection cta={home.cta} />
    </>
  );
}
