import { BreadcrumbJsonLd } from "../components/JsonLd";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { gallery } from "../lib/galleryData";
import Gallery from "../sections/Gallery";

export default function GalleryPage() {
  return (
    <>
      <SEO meta={gallery.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Gallery", href: "/gallery" },
        ]}
      />
      <PageHeader
        eyebrow="Gallery"
        title={
          <>
            <span className="page-header__title-line">Facilities and</span>
            <span className="page-header__title-line">community activities</span>
          </>
        }
        description="Step inside Aakash Eye Hospital through selected views of our clinical spaces, advanced facilities, and community care initiatives."
        image="/assets/media/page-headers/optometry-detail.jpg"
        variant="gallery"
      />
      <Gallery categories={gallery.categories} items={gallery.items} />
    </>
  );
}
