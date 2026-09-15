import contactRaw from "../data/contact.json";

export const contactPage = contactRaw;

/* Bharuch answers its OPD and operation desks on the same three numbers.
   Printed as two desks that is the same list twice, so consecutive desks
   sharing an identical number list are shown once under a joined label. */
export function mergeDesks(phoneGroups = []) {
  return phoneGroups.reduce((merged, group) => {
    const previous = merged[merged.length - 1];
    if (previous && previous.numbers.join("|") === group.numbers.join("|")) {
      previous.label = `${previous.label} / ${group.label}`;
      return merged;
    }
    merged.push({ label: group.label, numbers: [...group.numbers] });
    return merged;
  }, []);
}
