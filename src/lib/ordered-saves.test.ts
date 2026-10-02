import { describe, expect, it } from "vitest";
import { createOrderedSaves } from "@/lib/ordered-saves";

const after = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("createOrderedSaves", () => {
  it("lands saves for one key in the order they were asked for, even when the first is slow", async () => {
    const save = createOrderedSaves();
    const landed: string[] = [];
    const run = (name: string, ms: number) => async () => {
      await after(ms);
      landed.push(name);
    };

    // Pass, undo, pass again — the first one is the slowest.
    save("request-1", run("pass", 40));
    save("request-1", run("undo", 0));
    const last = save("request-1", run("pass again", 0));
    await last;

    expect(landed).toEqual(["pass", "undo", "pass again"]);
  });

  it("doesn't make different keys wait for each other", async () => {
    const save = createOrderedSaves();
    const landed: string[] = [];

    const slow = save("request-1", async () => {
      await after(40);
      landed.push("slow");
    });
    const quick = save("request-2", async () => {
      landed.push("quick");
    });
    await Promise.all([slow, quick]);

    expect(landed).toEqual(["quick", "slow"]);
  });

  it("carries on after a save fails", async () => {
    const save = createOrderedSaves();
    const landed: string[] = [];

    save("request-1", async () => {
      throw new Error("offline");
    });
    await save("request-1", async () => {
      landed.push("next");
    });

    expect(landed).toEqual(["next"]);
  });

  it("resolves even when its own save fails", async () => {
    const save = createOrderedSaves();
    await expect(
      save("request-1", async () => {
        throw new Error("offline");
      }),
    ).resolves.toBeUndefined();
  });
});
