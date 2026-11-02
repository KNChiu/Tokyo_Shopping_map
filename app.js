/* 東京購物速查 — 前端邏輯（無框架、無外部依賴；資料在 data.js） */
(() => {
  "use strict";
  const D = window.SHOP_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const areaById = Object.fromEntries(D.areas.map((a) => [a.id, a]));
  const buildById = Object.fromEntries(D.buildings.map((b) => [b.id, b]));
  const storeById = Object.fromEntries(D.stores.map((s) => [s.id, s]));
  const brandOrder = D.brands.map((b) => b.id);
  const areaOf = (s) => buildById[s.building].area;
  const storesOfArea = (area) => D.stores.filter((s) => areaOf(s) === area);
  const brandsOfArea = (area) => [...new Set(storesOfArea(area).map((s) => s.brand))];
  const isAltStore = (s) => /備案|授權|代售|待開幕/.test(`${s.alt} ${s.name}`);
  const mapUrl = (b) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${b.map} ${areaById[b.area].region || "東京都"} ${b.addr}`);

  // ═════════════════════════════ 時間 ═════════════════════════════
  const TZ = "Asia/Tokyo";
  const { WD, fmtHM, parseHours, dayRanges, openAt } = window.SHOP_HOURS;

  /** 台北時間（台灣固定 UTC+8；東京夏天 UTC+9、冬天 UTC+10 差距不同，所以實際算） */
  function taipeiHM() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    return `${get("hour")}:${get("minute")}`;
  }

  function tokyoNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { wd: wdMap[get("weekday")], h: +get("hour"), m: +get("minute") };
  }

  let NOW = tokyoNow();
  /** 「現在」＝模擬時間（網址帶 t= 參數時）或東京實際時間 */
  function currentNow() {
    if (!state.time) return { wd: NOW.wd, h: NOW.h, m: NOW.m };
    const [h, m] = state.time.split(":").map(Number);
    return { wd: NOW.wd, h, m };
  }
  const nowMin = () => { const t = currentNow(); return t.h * 60 + t.m; };
  function stateOf(store) {
    const h = store._h;
    if (!h) return { known: false };
    const t = currentNow();
    const cur = t.h * 60 + t.m;
    const isOpen = openAt(h, t.wd, cur);
    const r = dayRanges(h, t.wd).find((x) => cur >= x.start && cur < x.end);
    return { known: true, open: isOpen, close: r ? r.end : null };
  }
  /**
   * 此刻沒開，但今天稍晚還會開？（例：10:00 時看 11:00 才開的店）
   * 本表沒有公休日，所以我們自己的資料一定有「今天稍晚」或「明天」會開，
   * 只有少數店家會在現場臨時休館，需要人工再確認。
   */
  function opensLaterToday(store) {
    const t = currentNow();
    const cur = t.h * 60 + t.m;
    return dayRanges(store._h, t.wd).some((r) => r.end > cur && r.start > cur);
  }

  // ═════════════════════════════ 狀態（放進網址，可分享／書籤） ═════════════════════════════
  const state = { view: "area", area: null, brands: [], q: "", open: false, time: null };
  (function readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("view") === "brand") state.view = "brand";
    if (areaById[h.get("area")]) state.area = h.get("area");
    if (h.get("b")) state.brands = h.get("b").split(",").filter((x) => brandOrder.includes(x));
    if (h.get("q")) state.q = h.get("q");
    if (h.get("open") === "1") state.open = true;
    const tm = (h.get("t") || "").match(/^(\d{1,2}):(\d{2})$/);
    if (tm && +tm[1] < 24 && +tm[2] < 60) state.time = h.get("t");
  })();
  function writeHash() {
    const h = new URLSearchParams();
    if (state.view !== "area") h.set("view", state.view);
    if (state.area) h.set("area", state.area);
    if (state.brands.length) h.set("b", state.brands.join(","));
    if (state.q) h.set("q", state.q);
    if (state.open) h.set("open", "1");
    if (state.time) h.set("t", state.time);
    const s = h.toString();
    history.replaceState(null, "", s ? "#" + s : location.pathname + location.search);
  }

  // ═════════════════════════════ 正規化 ═════════════════════════════
  D.stores.forEach((s) => {
    s._h = parseHours(s.hours);
    const b = buildById[s.building];
    s._hay = [s.brand, s.name, b.name, b.addr, b.map, s.alt, (s.tags || []).join(" "), areaById[b.area].name].join(" ").toLowerCase();
  });

  function matchesQuery(s) {
    if (state.brands.length && !state.brands.includes(s.brand)) return false;
    if (state.q && !state.q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => s._hay.includes(w))) return false;
    return true;
  }
  /** 現在開著，或營業時間不明（不明時照常顯示） */
  const openNow = (s) => { const st = stateOf(s); return !(st.known && !st.open); };
  function storeHit(s) {
    if (!matchesQuery(s)) return false;
    if (state.open && !openNow(s)) return false;
    return true;
  }
  function areaHit(area) {
    if (!storesOfArea(area).length) return !state.brands.length && !state.q && !state.open;
    return storesOfArea(area).some(storeHit);
  }

  // ═════════════════════════════ 營業時間橫條 ═════════════════════════════
  const DAY_START = 6 * 60, DAY_END = 24 * 60;
  function hourBar(h) {
    if (!h) return "";
    const total = DAY_END - DAY_START;
    const segs = dayRanges(h, currentNow().wd).map((r) => {
      const s = Math.max(r.start, DAY_START), e = Math.min(r.end, DAY_END);
      if (e <= s) return "";
      return `<i class="hb-open" style="left:${((s - DAY_START) / total) * 100}%;width:${((e - s) / total) * 100}%"></i>`;
    }).join("");
    const cur = nowMin();
    const now = cur >= DAY_START && cur <= DAY_END ? `<i class="hb-now" style="left:${((cur - DAY_START) / total) * 100}%"></i>` : "";
    return `<span class="hours-bar" aria-hidden="true">${segs}${now}</span>`;
  }

  // ═════════════════════════════ 店舖列 ═════════════════════════════
  function storeRow(s, showFloor = false) {
    const st = stateOf(s);
    const dot = st.known ? `<span class="hok ${st.open ? "open" : "shut"}" title="${st.open ? "營業中" : "目前打烊"}"></span>` : "";
    const alt = isAltStore(s) ? '<span class="alt-tag">備案</span>' : "";
    const closes = state.open && st.known && st.open && st.close ? `<span class="closes">${fmtHM(st.close)} 關</span>` : "";
    return `<a class="s" href="${mapUrl(buildById[s.building])}" target="_blank" rel="noopener" data-store="${esc(s.id)}" title="在地圖開啟：${esc(s.name)}">
      <span class="s-brand">${dot}<span>${esc(s.brand)}</span>${alt}</span>
      <span class="s-name">${esc(s.name)}</span>
      ${showFloor ? `<span class="s-floor">${esc(s.floor)}</span>` : ""}
      ${s.alt ? `<span class="s-alt">${esc(s.alt)}</span>` : ""}
      <span class="s-hours">${hourBar(s._h)}<b>${esc(s.hours)}</b>${closes}</span>
    </a>`;
  }

  // ═════════════════════════════ 樓層標籤 ═════════════════════════════
  function floorBadge(floor) {
    return esc(floor.replace(/（.*$/, "").replace(/^◇\s*/, "◇"));
  }
  /** 樓層色階：越上面顏色越深（1F 最淺、4F 最深）；B 層與路面店固定淺 */
  const levelIndex = (s) => (s.level >= 1 ? Math.min(s.level, 4) : 0);
  function isPk(b) { return /PARCO|パルコ|ルミネ/.test(b.map); }

  // ═════════════════════════════ 建築卡片 ═════════════════════════════
  function buildingCard(b, idx) {
    const all = D.stores.filter((s) => s.building === b.id);
    const hits = all.filter(storeHit);
    const brandCount = new Set(all.map((s) => s.brand)).size;
    const rows = hits.map((s) => `
      <div class="row" data-store-row="${esc(s.id)}" style="--lv:${levelIndex(s)}">
        <span class="fl">${floorBadge(s.floor)}</span>
        ${storeRow(s)}
      </div>`).join("");
    const emptyRow = !hits.length ? `<div class="row none"><span class="fl">—</span><span class="none-txt">這棟目前沒有符合條件的店</span></div>` : "";
    return `<article class="bcard" id="b-${b.id}" style="--i:${idx}">
      <header class="bcard-head">
        <span class="pin">${String(idx + 1).padStart(2, "0")}</span>
        <div class="bh">
          <h3>${esc(b.name)}${isPk(b) ? '<span class="pk-tag">パルコ・ルミネ系</span>' : ""}</h3>
          <div class="baddr">${esc(b.addr)}${b.floorRange ? ` · 建築 ${esc(b.floorRange)}` : ""}</div>
        </div>
        <a class="map-btn" href="${mapUrl(b)}" target="_blank" rel="noopener" aria-label="在 Google 地圖開啟 ${esc(b.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>地圖
        </a>
      </header>
      <div class="stack">${rows}${emptyRow}</div>
      <footer class="bcard-note">${esc(b.note)}</footer>
      <div class="bcard-foot"><span>${brandCount} 個品牌 · ${all.length} 間店</span><span>${all.length - hits.length ? `已隱藏 ${all.length - hits.length} 間` : "全部符合"}</span></div>
    </article>`;
  }

  // ═════════════════════════════ 區域視圖 ═════════════════════════════
  function render() {
    $("#main").innerHTML = state.view === "brand" ? renderBrandView() : renderAreaView();
    bindDynamic();
    syncToolbar();
    const total = D.stores.filter(storeHit).length;
    const later = state.open ? D.stores.filter((s) => {
      const st = stateOf(s);
      return matchesQuery(s) && st.known && !st.open && opensLaterToday(s);
    }).length : 0;
    const t = currentNow();
    const when = state.time ? `模擬 ${state.time}` : `東京現在 ${fmtHM(t.h * 60 + t.m)}（週${WD[t.wd]}）`;
    $("#resultNote").innerHTML = state.open
      ? `只看 <b>${when}</b> 開著的店：<b>${total}</b> / ${D.stores.length} 間${later ? `（另有 ${later} 間稍後開）` : ""}`
      : `<b>${total}</b> / ${D.stores.length} 間店符合條件 · 營業狀態依 <b>${when}</b>`;
    classicClock();
  }

  function planBox(a) {
    return D.plans.filter((p) => p.area === a.id).map((plan) => {
      const steps = plan.steps.map((id, i) => {
        const s = storeById[id], b = buildById[s.building];
        return `${i ? '<span class="arrow">→</span>' : ""}<button class="step" data-act="jump" data-building="${b.id}" title="跳到 ${esc(b.name)}">
          <span class="step-n">${i + 1}</span>
          <span class="step-t"><b>${esc(b.name)}</b> <span class="step-fl">${floorBadge(s.floor)}</span> <em>${esc(s.brand)}</em></span></button>`;
      }).join("");
      return `<section class="plan-box">
        <div class="p-title"><span>▍走法 · ${esc(plan.title)}</span><span>${esc(plan.time)}</span></div>
        <div class="plan-route">${steps}</div>
        <p class="plan-rule">${esc(plan.rule)}</p>
      </section>`;
    }).join("");
  }

  function renderAreaView() {
    if (!state.area) return renderOverview();
    const a = areaById[state.area];
    const all = storesOfArea(a.id);
    const head = `<div class="crumb"><button class="back" data-act="home">← 全部區域</button><span class="path">區域 <b>${a.code}</b> / ${esc(a.name)}</span></div>
      <div class="area-head">
        <div class="k">Area ${a.code} · ${esc(a.sub)}</div>
        <h2>${esc(a.name)}</h2>
        <div class="asub"><span>品牌 <b>${brandsOfArea(a.id).length}</b> 種 · 店 <b>${all.length}</b> 間</span><span class="sep">｜</span><span>${esc(a.walk)}</span></div>
      </div>`;
    const clearFilter = `<button class="back solid" data-act="clear">放寬條件：看全部</button>`;

    if (!all.length) {
      return head.replace('class="area-head"', 'class="area-head no-stores"') + `
        <div class="empty-state left">
          <h3>品牌清單裡沒有店</h3>
          <p>${esc(a.note)}</p>
          <div class="es-actions">
            <button class="back solid" data-act="goto" data-area="ueno">→ 改看 F 上野／御徒町</button>
            <button class="back" data-act="home">← 回到區域總覽</button>
          </div>
        </div>`;
    }

    const filtering = state.brands.length || state.q || state.open;
    const buildIds = new Set(all.map((s) => s.building));
    const builds = D.buildings.filter((b) => buildIds.has(b.id))
      .filter((b) => !filtering || D.stores.some((s) => s.building === b.id && storeHit(s)));
    const cards = builds.map(buildingCard).join("");
    const empty = !builds.length ? `<div class="empty-state"><h3>${state.time ? `${state.time} 時，${esc(a.name)}這裡都沒有店開著` : "這個區域沒有符合條件的店"}</h3>
        <p>${state.time ? `這區今天的營業時間是 ${openSpan(a.id)}，換個時間或往別區找。` : "放寬品牌篩選或關掉「只看現在開著」，也可以切到「品牌清單」找最近的店。"}</p>
        <div class="es-actions" style="justify-content:center">${clearFilter}<button class="back" data-act="view" data-view="brand">→ 改看品牌清單</button></div></div>` : "";
    return head + planBox(a) + (a.note ? `<p class="area-note">${esc(a.note)}</p>` : "") +
      `<div class="buildings">${cards}${empty}</div>`;
  }

  /** 該區今天的營業範圍（給「都沒開」的空狀態用） */
  function openSpan(area) {
    const wd = currentNow().wd;
    const ranges = storesOfArea(area).flatMap((s) => (s._h ? dayRanges(s._h, wd) : []));
    return ranges.length
      ? `${fmtHM(Math.min(...ranges.map((r) => r.start)))}–${fmtHM(Math.max(...ranges.map((r) => r.end)))}`
      : "—";
  }

  function renderOverview() {
    const cards = D.areas.filter((a) => areaHit(a.id)).map((a, i) => {
      const all = storesOfArea(a.id), brands = brandsOfArea(a.id), hits = all.filter(storeHit);
      if (!all.length) {
        return `<article class="acard empty" data-code="${a.code}" style="--i:${i}">
          <header class="a-head"><span class="code">${a.code}</span><h3>${esc(a.name)}</h3><span class="a-sub">${esc(a.sub)}</span></header>
          <p class="akiba-note">${esc(a.note)}</p>
          <footer class="a-foot"><span>品牌店 0 間</span><button class="go" data-act="goto" data-area="ueno">→ 改看 上野／御徒町</button></footer>
        </article>`;
      }
      const shown = brands.filter((b) => hits.some((s) => s.brand === b));
      const dots = shown.slice(0, 6).map((b) => `<span class="bdot">${esc(b)}</span>`).join("") +
        (shown.length > 6 ? `<span class="bdot more">+${shown.length - 6}</span>` : "");
      return `<article class="acard" data-code="${a.code}" style="--i:${i}">
        <header class="a-head"><span class="code">${a.code}</span><h3>${esc(a.name)}</h3><span class="a-sub">${esc(a.sub)}</span></header>
        <div class="branddots">${dots}</div>
        <footer class="a-foot">
          <span class="a-hits"><b>${hits.length}</b> 間${state.open ? "開著" : "店"}<i>${esc(a.walk)}</i></span>
          <button class="go" data-act="goto" data-area="${a.id}">看樓層 →</button>
        </footer>
      </article>`;
    }).join("");
    const empty = !cards ? `<div class="empty-state"><h3>沒有符合條件的區域</h3><p>試著清除品牌或搜尋條件。</p></div>` : "";
    return `<div class="crumb"><span class="path">區域總覽 <b>${D.areas.length}</b> 區 · 點一區看樓層與採買</span></div>
      <div class="overview">${cards}${empty}</div>`;
  }

  // ═════════════════════════════ 品牌視圖 ═════════════════════════════
  function renderBrandView() {
    const rows = D.brands.filter((b) => !state.brands.length || state.brands.includes(b.id)).map((b) => {
      const stores = D.stores.filter((s) => s.brand === b.id && storeHit(s))
        .sort((x, y) => areaById[areaOf(x)].code.localeCompare(areaById[areaOf(y)].code) || x.level - y.level);
      if (!stores.length) return "";
      return `<div class="brand-row">
        <header class="bname">${esc(b.label)}<small>${esc(b.kind)} · ${stores.length} 間</small></header>
        <div class="bstore-list">${stores.map((s) => {
          const bd = buildById[s.building], ar = areaById[areaOf(s)], st = stateOf(s);
          return `<button class="bstore" data-act="store" data-building="${s.building}" data-store-id="${s.id}" title="跳到 ${esc(ar.name)} · ${esc(bd.name)}">
            <span class="fl">${floorBadge(s.floor)}</span>
            <span class="bs-main"><span class="bs-area"><span class="nowrap">${ar.code} · ${esc(ar.name)}</span><small>${esc(bd.name)}</small></span>
              <span class="bs-sub">${esc(s.name)}${s.alt ? ` · ${esc(s.alt)}` : ""}</span></span>
            <span class="bs-hours">${hourBar(s._h)}<b>${esc(s.hours)}</b>${st.known ? `<i class="${st.open ? "open" : ""}">${st.open ? "營業中" : "打烊"}</i>` : ""}</span>
            <span class="bs-go" aria-hidden="true">→</span>
          </button>`;
        }).join("")}</div>
      </div>`;
    }).join("");
    const crumb = `<div class="crumb"><span class="path">品牌清單 · <b>${D.brands.length}</b> 個品牌</span><span class="crumb-hint">點一間店 → 跳到那棟樓的樓層</span></div>`;
    if (!rows) return crumb + `<div class="empty-state"><h3>沒有符合條件的品牌</h3><p>清掉搜尋或「只看現在開著」再試。</p></div>`;
    return crumb + `<div class="brand-list">${rows}</div>`;
  }

  // ═════════════════════════════ 工具列／導覽 ═════════════════════════════
  function chipDim(brand) { return state.open && !D.stores.some((s) => s.brand === brand && openNow(s)); }
  function toggleBrand(id) {
    state.brands = state.brands.includes(id) ? state.brands.filter((x) => x !== id) : [...state.brands, id];
    writeHash(); render();
  }
  const brandBtn = (b, cls) => {
    const n = D.stores.filter((s) => s.brand === b.id).length;
    return `<button${cls ? ` class="${cls}"` : ""} data-brand="${esc(b.id)}" aria-pressed="${state.brands.includes(b.id)}">
      <span class="c" aria-hidden="true"></span>${esc(b.label)}<span class="n">${n}</span></button>`;
  };
  function buildChips() {
    // 桌機 chips 與手機面板共用同一份品牌資料
    $("#brandChips").innerHTML = '<span class="lbl">品牌</span>' + D.brands.map((b) => brandBtn(b, "chip")).join("");
    $("#brandGrid").innerHTML = D.brands.map((b) => brandBtn(b)).join("");
    $$("#brandChips .chip, #brandGrid button").forEach((c) => c.addEventListener("click", () => toggleBrand(c.dataset.brand)));
  }
  function syncToolbar() {
    $$("#brandChips .chip").forEach((c) => {
      c.setAttribute("aria-pressed", state.brands.includes(c.dataset.brand));
      c.classList.toggle("dim", chipDim(c.dataset.brand));
    });
    $$("#brandGrid button").forEach((c) => {
      c.setAttribute("aria-pressed", state.brands.includes(c.dataset.brand));
      c.classList.toggle("dim", chipDim(c.dataset.brand));
    });
    $("#brandCount").textContent = state.brands.length || "";
    $("#pickedBrands").innerHTML = state.brands.map((id) => {
      const b = D.brands.find((x) => x.id === id);
      return `<button class="chip" data-brand="${esc(id)}" aria-pressed="true" aria-label="取消 ${esc(b.label)}">
        ${esc(b.label)}<span class="x" aria-hidden="true">×</span></button>`;
    }).join("");
    $$("#pickedBrands .chip").forEach((c) => c.addEventListener("click", () => toggleBrand(c.dataset.brand)));

    $$(".seg button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === state.view));
    $("#openOnly").setAttribute("aria-pressed", state.open);
    $("#q").value = state.q;
    $("#openOnlyLabel").textContent = state.time ? `只看 ${state.time} 開著的店` : "只看現在開著";
    $("#clearAll").hidden = !(state.brands.length || state.q || state.open || state.area || state.time);
  }
  function classicClock() {
    $("#clock").textContent = fmtHM(nowMin());
    $("#nowstate").textContent = state.time
      ? `模擬時間 · 東京實際 ${fmtHM(NOW.h * 60 + NOW.m)}`
      : `台北 ${taipeiHM()} · 東京 週${WD[NOW.wd]}`;
    $("#nowstate").className = state.time ? "sim" : "ok";
    $("#nowChip").textContent = state.time ? "切回現在 ⟲" : "試不同時間 →";
    $("#nowChip").hidden = false;
  }
  function renderAtlas() {
    $("#atlasList").innerHTML = D.areas.map((a) => {
      const n = storesOfArea(a.id).length;
      return `<li class="${n ? "" : "empty"}"><a href="#area-${a.id}" data-area="${a.id}" title="${esc(a.sub)}" class="${state.area === a.id ? "active" : ""}">
        <span class="code">${a.code}</span>${esc(a.name)}<span class="n">${n || "–"}</span></a></li>`;
    }).join("");
    $$("#atlasList a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      goArea(a.dataset.area);
    }));
  }

  // ═════════════════════════════ 互動 ═════════════════════════════
  function goArea(id) {
    state.area = id; state.view = "area"; writeHash(); render(); renderAtlas();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function bindDynamic() {
    $$("#main [data-act]").forEach((el) => el.addEventListener("click", () => {
      const act = el.dataset.act;
      if (act === "home") goArea(null);
      if (act === "clear") { state.brands = []; state.q = ""; state.open = false; state.time = null; writeHash(); render(); }
      if (act === "view") { state.view = el.dataset.view; writeHash(); render(); }
      if (act === "goto") goArea(el.dataset.area);
      if (act === "store") {
        const id = el.dataset.storeId;
        state.area = areaById[buildById[el.dataset.building].area].id;
        writeHash(); render(); renderAtlas();
        setTimeout(() => flashRow(id), 90);
      }
      if (act === "jump") {
        const card = document.getElementById("b-" + el.dataset.building);
        if (!card) return;
        card.scrollIntoView({ block: "center", behavior: "smooth" });
        card.classList.add("flash");
        setTimeout(() => card.classList.remove("flash"), 1500);
      }
    }));
  }
  function flashRow(id) {
    const row = document.querySelector(`[data-store-row="${CSS.escape(id)}"]`);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    row.classList.add("flash-sel");
    row.closest(".bcard")?.classList.add("flash");
    setTimeout(() => { row.classList.remove("flash-sel"); row.closest(".bcard")?.classList.remove("flash"); }, 1700);
  }

  function setTime(t) {
    state.time = t;
    if (t) state.open = true;
    writeHash(); render();
  }
  function bindStatic() {
    $$(".seg button").forEach((b) => b.addEventListener("click", () => {
      if (state.view === b.dataset.view) return;
      state.view = b.dataset.view;
      writeHash(); render();
    }));
    $("#openOnly").addEventListener("click", () => {
      if (state.open) { state.open = false; state.time = null; } else { state.open = true; }
      writeHash(); render();
    });
    let timer;
    $("#q").addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim(); writeHash(); render(); }, 120);
    });
    $("#clearAll").addEventListener("click", () => {
      Object.assign(state, { area: null, brands: [], q: "", open: false, time: null });
      writeHash(); renderAtlas(); buildChips(); render();
    });
    // 手機品牌面板：原生 dialog 提供焦點鎖定、Esc 與背景 inert
    const sheet = $("#brandSheet");
    const setSheetOpen = (open) => {
      $("#brandBtn").setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("sheet-open", open);
    };
    const closeSheet = () => { sheet.close(); setSheetOpen(false); $("#brandBtn").focus(); };
    $("#brandBtn").addEventListener("click", () => { sheet.showModal(); sheet.focus(); setSheetOpen(true); });
    // Esc 由瀏覽器關閉，cancel 與 close 都同步一次狀態（idempotent）
    sheet.addEventListener("cancel", () => setSheetOpen(false));
    sheet.addEventListener("close", () => setSheetOpen(false));
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
    $("[data-act=closeSheet]").addEventListener("click", closeSheet);
    // 時間模擬：循環「現在 → 09:30 → 11:00 → 15:00 → 19:30 → 20:30 → 21:30 → 現在」
    const presets = [null, "09:30", "11:00", "15:00", "19:30", "20:30", "21:30"];
    $("#nowChip").addEventListener("click", () => setTime(presets[(presets.indexOf(state.time) + 1) % presets.length]));
    document.addEventListener("keydown", (e) => {
      if (e.target.closest?.("dialog")) return;
      if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey) return;
      if (e.key === "/") { e.preventDefault(); $("#q").focus(); }
      const n = +e.key;
      if (n >= 1 && n <= D.areas.length) goArea(D.areas[n - 1].id);
      if (e.key === "Escape") {
        if (state.area) goArea(null);
        else if (state.view === "brand") { state.view = "area"; writeHash(); render(); }
        else $("#clearAll").click();
      }
    });
  }

  // ═════════════════════════════ 啟動 ═════════════════════════════
  $(".brand-sub b").textContent = `${D.brands.length} 個品牌 · ${D.stores.length} 間店 · ${D.areas.length} 個區域。`;
  $("#dataStamp").textContent = `資料 ${D.meta.updated} 官網擷取`;
  bindStatic();
  renderAtlas();
  buildChips();
  render();
  setInterval(() => {
    const n = tokyoNow();
    if (n.h !== NOW.h || n.m !== NOW.m || n.wd !== NOW.wd) { NOW = n; render(); }
  }, 30000);
})();