import { useCallback, useState, useSyncExternalStore } from "react";

/* Every page arrives prerendered, and React adopts that copy rather than
   building a second one (main.jsx). Adopting needs React's first pass to
   produce exactly the markup the build wrote, so anything the build could not
   know - the hospital this reader chose, whether the opening curtain is up,
   the clock - is read only from the pass straight after it.

   useHydrated() is false on the server and during that first pass, and true
   from then on: useSyncExternalStore renders with the server snapshot while
   React adopts the page, then re-renders at once with the client one, before
   the curtain or the reload veil is lifted. A page reached by navigating in
   the app, or started without adopting (main.jsx), is true from its first
   render, exactly as before. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribeNever, onClient, onServer);
}

/* useState whose first value is the build's (`serverValue`) while React adopts
   the page, and the reader's own (`readClient()`) from the pass after - read
   once more at that moment, the way a fresh mount would read it. A component
   mounted later reads `readClient()` from the start. */
export function useClientState(readClient, serverValue) {
  const hydrated = useHydrated();
  const [state, setState] = useState(() => ({
    hydrated,
    value: hydrated ? readClient() : serverValue,
  }));
  let { value } = state;

  if (state.hydrated !== hydrated) {
    value = readClient();
    setState({ hydrated, value });
  }

  const setValue = useCallback((next) => {
    setState((current) => ({
      ...current,
      value: typeof next === "function" ? next(current.value) : next,
    }));
  }, []);

  return [value, setValue];
}

/* The year the build was made: the prerendered copy prints it, so React's
   first pass has to print the same one before the pass after reads the
   reader's clock. vite.config.js defines it for both builds. */
const BUILD_YEAR = Number(import.meta.env.BUILD_YEAR) || new Date().getFullYear();

export function useCurrentYear() {
  return useHydrated() ? new Date().getFullYear() : BUILD_YEAR;
}
