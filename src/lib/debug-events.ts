const g = globalThis as any;
if (!g.__lastEvents) g.__lastEvents = [];

export function recordEvent(e: any) {
  g.__lastEvents.unshift({ ...e, at: new Date().toISOString() });
  g.__lastEvents = g.__lastEvents.slice(0, 10);
}

export function getLastEvents() {
  return g.__lastEvents ?? [];
}
