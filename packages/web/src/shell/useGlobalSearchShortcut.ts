import { useEffect, useRef } from 'react';
import { isApplePlatform } from './platform';

/**
 * Calls `onTrigger` on ⌘K (macOS) or Ctrl+K (elsewhere). Without `onTrigger` the shortcut is left
 * to the browser. Ignores events already handled (`defaultPrevented`) or part of IME composition.
 */
export function useGlobalSearchShortcut(onTrigger: (() => void) | undefined): void {
  const handler = useRef(onTrigger);
  useEffect(() => {
    handler.current = onTrigger;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const trigger = handler.current;
      if (!trigger || event.defaultPrevented || event.isComposing) return;
      if (event.key.toLowerCase() !== 'k' || event.altKey || event.shiftKey) return;
      const apple = isApplePlatform();
      const modifier = apple ? event.metaKey : event.ctrlKey;
      const otherModifier = apple ? event.ctrlKey : event.metaKey;
      if (!modifier || otherModifier) return;
      event.preventDefault();
      trigger();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
