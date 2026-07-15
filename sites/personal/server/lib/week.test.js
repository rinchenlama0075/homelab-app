const test = require("node:test");
const assert = require("node:assert/strict");
const { daysUntil, todayUtcDate } = require("./week");

const NOW = new Date("2026-07-17T18:30:00Z"); // late in the day, UTC

test("daysUntil returns null for an open-ended commitment (no end date)", () => {
  assert.equal(daysUntil(null, NOW), null);
  assert.equal(daysUntil(undefined, NOW), null);
});

test("daysUntil is 0 when the end date is today, regardless of time of day", () => {
  assert.equal(daysUntil(todayUtcDate(NOW), NOW), 0);
});

test("daysUntil counts whole calendar days remaining", () => {
  assert.equal(daysUntil("2026-07-18", NOW), 1);
  assert.equal(daysUntil("2026-07-24", NOW), 7);
});

test("daysUntil is negative once the end date has passed", () => {
  assert.equal(daysUntil("2026-07-16", NOW), -1);
  assert.equal(daysUntil("2026-06-01", NOW), -46);
});

test("daysUntil is unaffected by the time-of-day component of `now`", () => {
  const earlyInDay = new Date("2026-07-17T00:00:01Z");
  const lateInDay = new Date("2026-07-17T23:59:59Z");
  assert.equal(daysUntil("2026-07-18", earlyInDay), 1);
  assert.equal(daysUntil("2026-07-18", lateInDay), 1);
});
