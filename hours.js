/* 營業時間解析與判斷（純函式，不碰 DOM；app.js 與 check.js 共用） */
window.SHOP_HOURS = (() => {
  "use strict";
  const WD = ["日", "一", "二", "三", "四", "五", "六"];
  // 05:00 前視為跨日營業（例：到 02:00）；只用於營業時間，現在時間直接用 h * 60 + m
  const toMin = (h, m) => { const v = +h * 60 + +(m || 0); return v < 300 ? v + 1440 : v; };
  const fmtHM = (min) => {
    const v = min === 1440 ? 1440 : ((min % 1440) + 1440) % 1440;
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  };

  const HM = "(\\d{1,2})[:：](\\d{2})";
  const SPAN = "(\\d{1,2})[:：](\\d{2})\\s*[–—−-]\\s*(\\d{1,2})[:：](\\d{2})";
  const span = (g) => [toMin(g[0], g[1]), toMin(g[2], g[3])];

  /** 解析速查表用到的幾種營業時間寫法 → { base:[開,關], byWeekday:{星期: [開,關]} } */
  function parseHours(text) {
    // 24 小時制（例：7-11）
    if (/24\s*小時|24時間/.test(text)) return { base: [0, 1440], byWeekday: {} };
    // 週一至六 11:00–20:30／日・祝 11:00–20:00   （週日整段不同）
    const weekdaySplit = text.match(new RegExp(`${SPAN}[／/]\\s*日・祝\\s*${SPAN}`));
    if (weekdaySplit) {
      return { base: span(weekdaySplit.slice(1, 5)), byWeekday: { 0: span(weekdaySplit.slice(5, 9)) } };
    }
    // 平日・六 11:00–20:00／日・祝 10:30–19:30、平日 11–21／六日 10:30–21   （六日整段不同）
    const dailySplit = text.match(new RegExp(`${SPAN}[／/]\\s*(?:日・祝|六日)\\s*${SPAN}`));
    if (dailySplit) {
      const we = span(dailySplit.slice(5, 9));
      return { base: span(dailySplit.slice(1, 5)), byWeekday: { 0: we, 6: we } };
    }
    // 8:00–21:00（週五到 22:00）
    const late = text.match(new RegExp(`${SPAN}（週五到\\s*${HM}）`));
    if (late) {
      const [o, c] = span(late.slice(1, 5));
      return { base: [o, c], byWeekday: { 5: [o, toMin(late[5], late[6])] } };
    }
    // 平日 11–21／六日 10:30–21   （小時、分鐘可混用）
    const HHM = "(\\d{1,2})(?:[:：](\\d{2}))?";
    const hh = text.match(new RegExp(
      `平日\\s*${HHM}\\s*[–—−-]\\s*${HHM}\\s*[／/]\\s*六日\\s*${HHM}\\s*[–—−-]\\s*${HHM}`
    ));
    if (hh) {
      const t = (h, m) => toMin(h, m || 0);
      const we = [t(hh[5], hh[6]), t(hh[7], hh[8])];
      return { base: [t(hh[1], hh[2]), t(hh[3], hh[4])], byWeekday: { 0: we, 6: we } };
    }
    const m = text.match(new RegExp(SPAN));
    return m ? { base: span(m.slice(1, 5)), byWeekday: {} } : null;
  }

  /** 某個星期幾（週日 = 0）的營業區間；昨天營業到深夜會帶進今天凌晨 */
  function dayRanges(h, wd) {
    if (!h) return [];
    const today = h.byWeekday[wd] || h.base;
    const prev = h.byWeekday[(wd + 6) % 7] || h.base;
    const ranges = [{ start: today[0], end: Math.min(today[1], 1440) }];
    if (prev[1] > 1440) ranges.push({ start: 0, end: prev[1] - 1440 });
    return ranges;
  }
  const openAt = (h, wd, minuteOfDay) =>
    dayRanges(h, wd).some((r) => minuteOfDay >= r.start && minuteOfDay < r.end);

  return { WD, toMin, fmtHM, parseHours, dayRanges, openAt };
})();
