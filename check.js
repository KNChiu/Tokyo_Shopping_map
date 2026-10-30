/* 營業時間回歸檢查：node check.js */
const assert = require("node:assert/strict");

global.window = {};
require("./data.js");
require("./hours.js");

const { parseHours, openAt } = window.SHOP_HOURS;
const D = window.SHOP_DATA;
const store = (id) => D.stores.find((s) => s.id === id);
const open = (id, wd, h, m = 0) => openAt(parseHours(store(id).hours), wd, h * 60 + m);

// 週末時段不能把「10:30–21」讀成 10:00–30:00
assert.deepEqual(parseHours("平日 11–21／六日 10:30–21"), {
  base: [660, 1260],
  byWeekday: { 0: [630, 1260], 6: [630, 1260] },
});

// 平日 10:45 還沒開，週六 10:45 已開，週六 21:30 已關
assert.equal(open("lf-lumineest", 1, 10, 45), false);
assert.equal(open("lf-lumineest", 6, 10, 45), true);
assert.equal(open("lf-lumineest", 6, 21, 30), false);

// 週三 20:30 還開著，週日 20:30 已關（不能永遠用週日）
assert.equal(open("noble-hikarie", 3, 20, 30), true);
assert.equal(open("noble-hikarie", 0, 20, 30), false);

// 週六用平日時段，週日才用日・祝時段
assert.deepEqual(parseHours("平日・六 11:00–20:00／日・祝 10:30–19:30"), {
  base: [660, 1200],
  byWeekday: { 0: [630, 1170] },
});

// 週五延長營業只影響週五
const friday = parseHours("8:00–21:00（週五到 22:00）");
assert.equal(openAt(friday, 5, 21 * 60 + 30), true);
assert.equal(openAt(friday, 4, 21 * 60 + 30), false);

// 跨午夜：前一日 11:00–02:00 延續到週三凌晨
const late = parseHours("11:00–02:00");
assert.equal(openAt(late, 3, 60), true);
assert.equal(openAt(late, 3, 120), false);

for (const s of D.stores) assert.ok(parseHours(s.hours), s.id);

console.log(`ok: ${D.stores.length} stores, hours checks passed`);
