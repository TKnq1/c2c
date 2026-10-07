// The morning song lives in this browser only (IndexedDB): it is never uploaded, so the file stays on the device it was
// picked on. Everything here fails soft: with storage blocked there is simply no song.
const DB_NAME = "comtor-admin";
const STORE = "songs";

export type StoredSong = { id: number; name: string; blob: Blob; addedAt: number };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = work(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function listSongs(): Promise<StoredSong[]> {
  try {
    return await run("readonly", (store) => store.getAll() as IDBRequest<StoredSong[]>);
  } catch {
    return [];
  }
}

export async function addSongs(files: File[]): Promise<void> {
  for (const file of files) {
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name)) continue;
    await run("readwrite", (store) => store.add({ name: file.name, blob: file, addedAt: Date.now() }));
  }
}

export async function removeSong(id: number): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(id));
  } catch {
    // Nothing to remove.
  }
}

// One song per day from the list, in turn: the same song all day, a different one tomorrow.
export function songOfTheDay(songs: StoredSong[], now = new Date()): StoredSong | null {
  if (songs.length === 0) return null;
  const day = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  return songs[day % songs.length];
}

// Plays from silence up to `volume` (0 to 100) over a couple of seconds. Returns the element so the caller can stop it.
export function playSong(song: StoredSong, volume: number): HTMLAudioElement {
  const audio = new Audio(URL.createObjectURL(song.blob));
  const target = Math.max(0, Math.min(1, volume / 100));
  audio.volume = 0;
  audio.loop = true;
  void audio.play().catch(() => {
    // Blocked or unsupported: the screen still works without sound.
  });
  const started = performance.now();
  const fade = (now: number) => {
    const progress = Math.min(1, (now - started) / 2500);
    audio.volume = target * progress;
    if (progress < 1 && !audio.paused) requestAnimationFrame(fade);
  };
  requestAnimationFrame(fade);
  return audio;
}
