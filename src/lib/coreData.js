import branchesRaw from "../data/branches.json";
import navigationRaw from "../data/navigation.json";
import siteRaw from "../data/site.json";
import themeRaw from "../data/theme.json";

export const site = siteRaw;
export const defaultSeo = site.defaultSeo;
export const theme = themeRaw;
export const navigation = navigationRaw;
export const branches = branchesRaw;

export function getSeo(meta) {
  return {
    ...site.defaultSeo,
    ...meta,
  };
}
