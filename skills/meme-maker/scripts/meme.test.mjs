import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { defaultBoxes, escapeXml, textSvg, wrapText } from "./meme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = path.resolve(__dirname, "../references/templates.json");

test("escapeXml escapes XML/SVG special characters", () => {
  assert.equal(
    escapeXml(`S&P 500 <script>"alert('x')"</script>`),
    "S&amp;P 500 &lt;script&gt;&quot;alert(&apos;x&apos;)&quot;&lt;/script&gt;",
  );
});

test("wrapText wraps long phrases within maxChars", () => {
  const lines = wrapText("One does not simply buy the dip without cash", 16);
  assert.ok(lines.length >= 2);
  for (const line of lines) {
    assert.ok(line.length <= 16, `line exceeded 16 chars: ${line}`);
  }
});

test("textSvg rotates around (centerX, 0) in translated coordinate space", () => {
  const svg = textSvg("S&P 500", { x: 0.4, y: 0.5, w: 0.4, h: 0.2, rotate: -6 }, 1000, 1000, 0);
  assert.ok(svg.includes("S&amp;P 500"), "escaped text missing");
  assert.ok(
    svg.includes('transform="translate(0 600.0) rotate(-6 600.0 0)"'),
    `unexpected transform: ${svg}`,
  );
});

test("defaultBoxes returns in-bounds normalized boxes", () => {
  for (const count of [1, 2, 3, 4]) {
    const boxes = defaultBoxes(count);
    assert.equal(boxes.length, count);
    for (const b of boxes) {
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1.001 && b.y + b.h <= 1.001);
    }
  }
});

test("templates.json has valid schema and in-bounds boxes for all templates", () => {
  const templates = JSON.parse(fs.readFileSync(TEMPLATES_PATH, "utf8"));
  assert.ok(Array.isArray(templates) && templates.length >= 36);
  for (const t of templates) {
    assert.ok(typeof t.id === "string" && t.id.length > 0);
    assert.ok(Array.isArray(t.boxes) && t.boxes.length >= 1, `${t.id} missing boxes`);
    for (const b of t.boxes) {
      assert.ok(b.x >= 0 && b.x <= 1, `${t.id} invalid x`);
      assert.ok(b.y >= 0 && b.y <= 1, `${t.id} invalid y`);
      assert.ok(b.w > 0 && b.x + b.w <= 1.001, `${t.id} x+w out of bounds`);
      assert.ok(b.h > 0 && b.y + b.h <= 1.001, `${t.id} y+h out of bounds`);
    }
  }
});
