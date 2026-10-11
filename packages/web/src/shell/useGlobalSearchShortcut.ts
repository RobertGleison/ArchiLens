import { useEffect, useRef } from 'react';

/** Calls `onTrigger` when ⌘K (macOS) or Ctrl+K is pressed anywhere in the document. */
export function useGlobalSearchShortcut(onTrigger: () => void): void {
  const handler = useRef(onTrigger);
  useEffect(() => {
    handler.current = onTrigger;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      handler.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
