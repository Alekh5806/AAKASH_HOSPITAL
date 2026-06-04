import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { gallery } from "../lib/data";
import Gallery from "../sections/Gallery";

export default function GalleryPage() {
  return (
    <>
      <SEO meta={gallery.seo} />
      <PageHeader
        eyebrow="Gallery"
        title={
          <>
            <span className="page-header__title-line">Facilities and</span>
            <span className="page-header__title-line">community activities</span>
          </>
        }
        description="A view of hospital facilities and selected social activities from the legacy website."
        image="/assets/media/page-headers/optometry-detail.jpg"
        variant="gallery"
      />
      <Gallery categories={gallery.categories} items={gallery.items} />
    </>
  );
}
