import { useMemo, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import BranchActionBar from "../components/BranchActionBar";
import { BranchPageJsonLd, BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { hasBranchPage } from "../lib/contact";
import {
  getBranchBySlug,
  getBranchServices,
  getBranchTeam,
  getOtherBranches,
} from "../lib/branchData";
import BranchCare from "../sections/BranchCare";
import BranchHero from "../sections/BranchHero";
import BranchInside from "../sections/BranchInside";
import BranchLocate from "../sections/BranchLocate";
import BranchOthers from "../sections/BranchOthers";
import BranchTeam from "../sections/BranchTeam";

/* One hospital, on its own page: where it is and how to reach it, who sees
 * patients there, what it looks like inside, and the way to the other five.
 *
 * Only a branch carrying a `page` block in branches.json has one of these; a
 * slug without one falls back to the index with that hospital selected, so a
 * link to /branches/<slug> resolves for every hospital whether or not its page
 * has been built yet. */
export default function BranchPage() {
  const { slug } = useParams();
  const branch = getBranchBySlug(slug);
  const heroActionsRef = useRef(null);

  const team = useMemo(() => (branch ? getBranchTeam(branch) : null), [branch]);
  const services = useMemo(() => (branch ? getBranchServices(branch) : []), [branch]);
  const others = useMemo(() => getOtherBranches(slug), [slug]);

  if (!branch) return <Navigate to="/branches" replace />;
  if (!hasBranchPage(branch)) return <Navigate to={`/branches?branch=${branch.slug}`} replace />;

  return (
    <>
      <SEO meta={branch.page.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Our Hospitals", href: "/branches" },
          { name: branch.name, href: `/branches/${branch.slug}` },
        ]}
      />
      <BranchPageJsonLd branch={branch} />

      <BranchHero branch={branch} actionsRef={heroActionsRef} />
      <BranchLocate branch={branch} />
      <BranchTeam branch={branch} team={team} />
      <BranchCare branch={branch} services={services} />
      <BranchInside branch={branch} />
      <BranchOthers branches={others} />

      <BranchActionBar branch={branch} anchorRef={heroActionsRef} />
    </>
  );
}
