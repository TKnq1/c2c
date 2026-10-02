// Runs the saves for one key (say, a request) one after the other, in the
// order they were asked for, without making the caller wait. The Feed's pass,
// its undo and a second pass of the same card are fire-and-forget calls: sent
// the moment they happen, a slow first one can land after a later one and
// overwrite it. A failed save is dropped and doesn't hold the next one up.
export function createOrderedSaves() {
  const tails = new Map<string, Promise<void>>();

  return function save(key: string, run: () => Promise<unknown>): Promise<void> {
    const tail = (tails.get(key) ?? Promise.resolve()).then(run).then(
      () => {},
      () => {},
    );
    tails.set(key, tail);
    // Nothing queued behind it any more: forget the key.
    void tail.then(() => {
      if (tails.get(key) === tail) tails.delete(key);
    });
    return tail;
  };
}
