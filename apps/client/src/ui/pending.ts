export function introPending(ready: boolean, looking: boolean, busy: boolean): boolean {
  return !ready || looking || busy;
}
