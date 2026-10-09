import { useMemo, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import BranchActionBar from "../components/BranchActionBar";
import LazyNotFound from "../components/LazyNotFound";
import { BranchJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { hasBranchPage } from "../lib/contact";
import { getBranchBySlug, getBranchServices, getOtherBranches } from "../lib/branchData";
import { getBranchTeam, isOptometrist } from "../lib/doctorsData";
import BranchCare from "../sections/BranchCare";
import BranchHero from "../sections/BranchHero";
import BranchInside from "../sections/BranchInside";
import BranchLocate from "../sections/BranchLocate";
import BranchOthers from "../sections/BranchOthers";
import BranchTeam from "../sections/BranchTeam";
import "../styles/branch.css";

/* One hospital, on its own page: where it is and how to reach it, who sees
 * patients there, what it looks like inside, and the way to the other five.
 *
 * Only a branch carrying a `page` block in branches.json has one of these; a
 * slug without one falls back to the index with that hospital selected, so a
 * link to /branches/<slug> resolves for every hospital whether or not its page
 * has been built yet. A slug that names no hospital is the not-found page -
 * the server answers it with a 404, and the page must not say otherwise. */
export default function BranchPage() {
  const { slug } = useParams();
  const branch = getBranchBySlug(slug);
  const heroActionsRef = useRef(null);

  const team = useMemo(() => (branch ? getBranchTeam(branch) : null), [branch]);
  const services = useMemo(() => (branch ? getBranchServices(branch) : []), [branch]);
  const others = useMemo(() => getOtherBranches(slug), [slug]);

  if (!branch) return <LazyNotFound />;
  if (!hasBranchPage(branch)) return <Navigate to={`/branches?branch=${branch.slug}`} replace />;

  return (
    <>
      <SEO meta={{ imageAlt: branch.page.imageAlt, ...branch.page.seo }} />
      <BranchJsonLd
        branch={branch}
        services={services}
        team={team}
        isOptometrist={isOptometrist}
      />

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
