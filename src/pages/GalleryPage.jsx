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
        title="Facilities and community activities"
        description="A view of hospital facilities and selected social activities from the legacy website."
      />
      <Gallery categories={gallery.categories} items={gallery.items} />
    </>
  );
}
