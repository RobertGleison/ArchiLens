import { createContext, useContext } from 'react';

/**
 * Whether the component is rendered inside a container that already announces its content (a
 * `role="status"` / `role="alert"` region), e.g. `DataTable`'s empty / loading / error area.
 *
 * State components (`ErrorState`, the skeletons, a labelled `Spinner`) announce themselves with
 * their own live role, except inside such a region, where a nested live region would make screen
 * readers read the change twice. Containers that are live regions wrap their content in
 * `<LiveRegionContext.Provider value>`; composite components do the same for their parts.
 */
export const LiveRegionContext = createContext(false);

/** `role` for a self-announcing state component, or `undefined` inside a live region. */
export function useLiveRole<R extends 'status' | 'alert'>(role: R): R | undefined {
  return useContext(LiveRegionContext) ? undefined : role;
}
