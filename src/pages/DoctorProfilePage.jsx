import { useParams } from "react-router-dom";
import { DoctorJsonLd } from "../components/JsonLd";
import LazyNotFound from "../components/LazyNotFound";
import SEO from "../components/SEO";
import {
  getColleagues,
  getDoctorBySlug,
  getDoctorHospitals,
  getProfileSeo,
} from "../lib/doctorsData";
import { getServiceBySlug } from "../lib/servicesData";
import DoctorCare from "../sections/DoctorCare";
import DoctorColleagues from "../sections/DoctorColleagues";
import DoctorHero from "../sections/DoctorHero";
import DoctorVisits from "../sections/DoctorVisits";
import "../styles/doctor.css";

/* One doctor, on their own page: who they are, where and when to see them,
 * what to see them for, and the colleagues at the same hospitals.
 *
 * Every word is the hospital's own data in doctors.json - the name,
 * qualifications, specialty and interests, the hospitals and visiting days,
 * and the treatments their interests point to - so a page needs no copy of
 * its own and a new doctor needs only a record with a `slug`. A slug that
 * names nobody (or an optometrist, who has no page) is the not-found page,
 * which the server answers with a 404. */
export default function DoctorProfilePage() {
  const { slug } = useParams();
  const doctor = getDoctorBySlug(slug);

  if (!doctor) return <LazyNotFound />;

  const hospitals = getDoctorHospitals(doctor);
  const home = hospitals.find((entry) => entry.based) ?? hospitals[0];
  const services = (doctor.services ?? []).map(getServiceBySlug).filter(Boolean);
  const seo = getProfileSeo(doctor);

  return (
    <>
      <SEO meta={seo} />
      <DoctorJsonLd doctor={doctor} meta={seo} services={services} />

      <DoctorHero doctor={doctor} home={home} />
      <DoctorVisits doctor={doctor} hospitals={hospitals} />
      <DoctorCare doctor={doctor} services={services} />
      <DoctorColleagues doctor={doctor} colleagues={getColleagues(doctor)} />
    </>
  );
}
