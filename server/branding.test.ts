import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("KEIRA branding configuration", () => {
  it("uses KEIRA as the application title", () => {
    const html = readFileSync(resolve(import.meta.dirname, "../client/index.html"), "utf8");
    expect(html).toMatch(/<title>KEIRA<\/title>/);
  });
});
