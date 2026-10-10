// Pressing a tab you're already on doesn't navigate anywhere (there's
// nowhere to go), but screens still want a way to react to it — e.g.
// refetch data or scroll to top, the way native tab bars do. This is a
// minimal pub/sub so the root tab bar can announce a reselect without
// screens needing a navigation prop or context wiring.
const listeners = new Set();

export function onTabReselect(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function emitTabReselect(key) {
  listeners.forEach((callback) => callback(key));
}
