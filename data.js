/*
 * 東京購物區域速查 — 資料檔
 * 來源：../東京購物區域速查_含樓層.md（擷取於 2025–26 年官網）
 * 之後要更新資料，只改這個檔案即可；index.html 不用動。
 *
 * 資料模型
 *   AREA  { id, name, sub, walk, note }
 *   BUILD { id, area, name, floorRange, addr, map, note }
 *   STORE { id, brand, name, building, floor(文字), level(排序數字，B1 = 0),
 *           hours, status: "ok" | "check", alt, tags }
 *   PLAN  { area, title, steps[], rule, time }
 *   PICK  快判表（區域 → 品牌摘要），保留原文
 */
window.SHOP_DATA = (() => {
  const areas = [
    {
      id: "tokyo", code: "A", name: "東京站", sub: "八重洲／丸之內", walk: "八重洲南口 ↔ 京橋 6 分",
      note: "品牌直營店沒有，只有一間在步行圈內；京橋店是都內最大級。"
    },
    {
      id: "ginza", code: "B", name: "銀座", sub: "含有樂町／京橋", walk: "銀座站 ↔ 有樂町 ↔ 京橋 皆步行圈",
      note: "銀座インズ2 1F 的 DISCOAT、AZUL、VIS 三間連著逛，大概 30 分鐘就能走完。"
    },
    {
      id: "shinjuku", code: "C", name: "新宿", sub: "ルミネエスト／NEWoMan／マルイ", walk: "各館之間 5–8 分",
      note: "走法：ルミネエスト 2F → 3F → ルミネ新宿2 2F → NEWoMan 1F → 新宿マルイ 1F。補 HOKA 更快：アートスポーツ ヨドバシ新宿西口店（B1F/B2F，開到很晚）。"
    },
    {
      id: "shibuya", code: "D", name: "澀谷", sub: "神南／宇田川町／ヒカリエ", walk: "渋谷站 A7 出口 ↔ パルコ／ヒカリエ 10 分內",
      note: "幾乎所有品牌 11:00 才開門，9–11 點這段只能喝咖啡、散步。"
    },
    {
      id: "aoyama", code: "E", name: "表參道／原宿", sub: "青山 · 神宮前", walk: "表參道 ↔ 原宿 10–15 分串完",
      note: "這幾個點沿著同一條路。TODAYFUL 本體只有代官山、堀江、福岡三間直營；表參道這間是選品店代售。"
    },
    {
      id: "ueno", code: "F", name: "上野／御徒町", sub: "阿美橫町", walk: "上野站 ↔ 御徒町站 8 分",
      note: "上野站到御徒町站中間就是阿美橫町，走一趟三間都能到；3COINS 在站內、改札內，要逛就先別出站。"
    },
    {
      id: "yuzawa", code: "G", name: "越後湯澤", sub: "新潟 · 南魚沼／湯澤溫泉街",
      walk: "東口 ↔ 西口 5 分 · のぐち本店 東口 5 分",
      note: "站內 CoCoLo 一次買齊土產、地酒、便當；生鮮超市只有東口的のぐち，19:00 就關。",
      region: "新潟県"
    }
  ];

  const buildings = [
    // ── A 東京站
    { id: "sqgarden", area: "tokyo", name: "東京スクエアガーデン", floorRange: "B1–2F", addr: "京橋3-1-1", map: "東京スクエアガーデン",
      note: "八重洲南口走路 6 分；銀座線京橋站 3 號出口直結。Mont-bell 京橋店是都內最大級。" },
    // ── B 銀座
    { id: "ginzasix", area: "ginza", name: "GINZA SIX", floorRange: "B2–6F", addr: "銀座6-10-1", map: "GINZA SIX",
      note: "lululemon 4F、Le Labo 1F；退稅統一到 1F 辦理。" },
    { id: "inzs2", area: "ginza", name: "銀座インズ2", floorRange: "B1–1F", addr: "銀座西2-2先", map: "銀座インズ2",
      note: "1F 三間（DISCOAT／AZUL／VIS）連著，30 分鐘走完。" },
    { id: "nishiginza", area: "ginza", name: "西銀座デパート", floorRange: "B1–3F", addr: "銀座4-1", map: "西銀座デパート",
      note: "銀座站 C5／C7 出口直結。" },
    { id: "yurakuchomarui", area: "ginza", name: "有楽町マルイ", floorRange: "B1–8F", addr: "有楽町2-7-1", map: "有楽町マルイ",
      note: "従銀座步行約 8 分鐘。" },
    // ── C 新宿
    { id: "lumineest", area: "shinjuku", name: "ルミネエスト", floorRange: "B1–8F", addr: "新宿3-38-1", map: "ルミネエスト新宿",
      note: "2F：LOWRYS FARM、Heather｜3F：3COINS、VIS。Heather 結束營運時間較早，建議先逛。" },
    { id: "lumine2", area: "shinjuku", name: "ルミネ新宿2", floorRange: "B1–8F", addr: "新宿3-38-2", map: "ルミネ新宿",
      note: "2F：STUDIOUS（代售 TODAYFUL）、NOBLE，同層一起逛。" },
    { id: "shinjukumrui", area: "shinjuku", name: "新宿マルイ", floorRange: "B1–8F", addr: "新宿3-30-13", map: "新宿マルイ本館",
      note: "lululemon 1F，21:00 關。" },
    { id: "newoman", area: "shinjuku", name: "NEWoMan 新宿", floorRange: "B1–5F", addr: "新宿4-1-6", map: "NEWoMan新宿",
      note: "新宿南口直結；Le Labo 1F。" },
    { id: "lbreath", area: "shinjuku", name: "エルブレス新宿ビル（L-Breath）", floorRange: "B1–8F", addr: "新宿4-1-11", map: "エルブレス新宿",
      note: "HOKA 授權店在鞋類賣場分層，以現場導覽為準。" },
    { id: "yodoshinjuku", area: "shinjuku", name: "ヨドバシ新宿西口本店", floorRange: "B2–7F", addr: "西新宿1-10-1", map: "ヨドバシカメラ新宿西口本店",
      note: "アートスポーツ在 B1F/B2F，09:30–22:00 開到很晚，補 HOKA 最快。" },
    // ── D 澀谷
    { id: "kca", area: "shibuya", name: "KCA渋谷（公園通り）", floorRange: "1–4F", addr: "神南1-22-3", map: "KCA渋谷",
      note: "渋谷站 A7 出口走路 1 分；HOKA 3 層旗艦店，試穿、比較最合適。" },
    { id: "montshibuya", area: "shibuya", name: "モンベル渋谷ビル", floorRange: "B1–4F", addr: "宇田川町11-5", map: "モンベル渋谷店",
      note: "女裝 3F、男裝 1–2F、鞋／背包 4F、露營 B1。" },
    { id: "llshibuya", area: "shibuya", name: "lululemon Shibuya（路面店）", floorRange: "路面店", addr: "神南1-23-10", map: "lululemon Shibuya",
      note: "路面店，以現場樓層導覽為準。" },
    { id: "shibuparco", area: "shibuya", name: "渋谷PARCO", floorRange: "B1–10F", addr: "宇田川町15-1", map: "渋谷PARCO",
      note: "Le Labo 1F。" },
    { id: "hikarie", area: "shibuya", name: "渋谷ヒカリエ ShinQs", floorRange: "B3–5F", addr: "渋谷2-21-1", map: "渋谷ヒカリエ",
      note: "NOBLE 3F（備案）。" },
    // ── E 表參道／原宿
    { id: "greenfantasia", area: "aoyama", name: "グリーンファンタジアビル", floorRange: "1–3F", addr: "神宮前1-11-11", map: "グリーンファンタジア",
      note: "HOKA Harajuku 1F–2F。" },
    { id: "studiousaoyama", area: "aoyama", name: "STUDIOUS WOMENS 表參道店（路面店）", floorRange: "路面店", addr: "神宮前4-26-30", map: "STUDIOUS WOMENS 表参道",
      note: "選品店代售 TODAYFUL，以現場樓層導覽為準。" },
    { id: "lelaboharajuku", area: "aoyama", name: "ル ラボ 原宿（街邊店）", floorRange: "街邊店", addr: "神宮前4-32-8", map: "ル ラボ 原宿",
      note: "街邊店，以現場樓層導覽為準。" },
    { id: "lelaboaoyama", area: "aoyama", name: "ル ラボ 青山（街邊店）", floorRange: "街邊店", addr: "南青山5-5-24", map: "ル ラボ 青山",
      note: "街邊店，以現場樓層導覽為準。" },
    { id: "hcube", area: "aoyama", name: "H-CUBE MINAMIAOYAMA II", floorRange: "1–2F", addr: "南青山5-5-1", map: "H-CUBE MINAMIAOYAMA",
      note: "lululemon 1F（另有 2F）。" },
    { id: "quest", area: "aoyama", name: "原宿クエスト（舊 NIKE 位置）", floorRange: "B1–6F", addr: "神宮前1-13-12", map: "原宿クエスト",
      note: "ルルレモン原宿 1F–2F，2026.8.19 開幕。" },
    // ── F 上野／御徒町
    { id: "comterrace", area: "ueno", name: "コムテラス御徒町", floorRange: "B1–4F", addr: "上野3-22-6", map: "コムテラス御徒町",
      note: "御徒町站南口立刻到；Mont-bell 4 層 350 坪，無休。" },
    { id: "ecute", area: "ueno", name: "ecute 上野（改札內）", floorRange: "改札內 1–3F", addr: "上野駅改札內", map: "ecute上野",
      note: "改札內，要逛就先別出站。" },
    { id: "parkplace", area: "ueno", name: "松坂屋パークプレイス24", floorRange: "B1–4F", addr: "上野3-25-10", map: "松坂屋パークプレイス24",
      note: "御徒町站走路 1 分；アートスポーツ本店鞋類在 1F。" },
    // ── G 越後湯澤
    { id: "cocolo", area: "yuzawa", name: "CoCoLo 湯沢 がんぎどおり", floorRange: "1F", addr: "湯沢2427-1", map: "CoCoLo湯沢 がんぎどおり",
      note: "新幹線改札出站即到；土產、地酒、便當集中在這一條。" },
    { id: "noguchi", area: "yuzawa", name: "ショッピングセンターのぐち 本店", addr: "湯沢2875-7", map: "ショッピングセンターのぐち 本店",
      note: "東口徒步 5 分，離車站最近的生鮮超市；店內有 100 円商店。" },
    { id: "noguchi-hearts", area: "yuzawa", name: "のぐち 湯沢ハーツ店", addr: "湯沢字中島川原1685", map: "ショッピングセンターのぐち 湯沢ハーツ店",
      note: "國道 17 號旁，徒步約 20 分；品項最多、開到 21:00。" },
    { id: "matsukiyo", area: "yuzawa", name: "マツモトキヨシ 越後湯沢駅前店", addr: "湯沢2427-2", map: "マツモトキヨシ 越後湯沢駅前店",
      note: "東口出站左轉即到；日用品、零食、飲料。" },
    { id: "seven-yuzawa", area: "yuzawa", name: "セブン-イレブン 越後湯沢西口店", addr: "湯沢2450", map: "セブン-イレブン 越後湯沢西口店",
      note: "西口徒步 1 分，站外唯一 24 小時便利店；門口路窄，別開車。" }
  ];

  const stores = [
    // ── A
    { id: "mb-kyobashi", brand: "Mont-bell", name: "モンベル 東京京橋店", building: "sqgarden",
      floor: "1F–2F", level: 1, hours: "11:00–21:00（依大樓休館日）", status: "ok",
      alt: "男女裝 1F、鞋／背包／裝備 2F", tags: ["服飾", "鞋", "背包", "露營"] },
    // ── B
    { id: "ll-ginzasix", brand: "Lululemon", name: "lululemon - GINZA SIX", building: "ginzasix",
      floor: "4F", level: 4, hours: "10:30–20:30", status: "ok",
      alt: "退稅統一到 1F 辦", tags: ["服飾", "運動"] },
    { id: "nel-ginzasix", brand: "Le Labo", name: "ル ラボ GINZA SIX", building: "ginzasix",
      floor: "1F", level: 1, hours: "10:30–20:30", status: "ok",
      alt: "", tags: ["香氛"] },
    { id: "disc-inzs2", brand: "DISCOAT", name: "DISCOAT 銀座インズ2店", building: "inzs2",
      floor: "1F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "", tags: ["服飾"] },
    { id: "azul-inzs2", brand: "AZUL by MOUSSY", name: "AZUL BY MOUSSY 銀座インズ2店", building: "inzs2",
      floor: "1F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "和 DISCOAT 同層", tags: ["服飾"] },
    { id: "vis-inzs2", brand: "VIS", name: "VIS 銀座インズ2", building: "inzs2",
      floor: "1F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "同上", tags: ["服飾"] },
    { id: "3c-nishiginza", brand: "3COINS", name: "3COINS＋plus 西銀座デパート店", building: "nishiginza",
      floor: "2F", level: 2, hours: "11:00–20:00", status: "ok",
      alt: "銀座站 C5／C7 出口直結", tags: ["雜貨", "生活"] },
    { id: "noble-yurakucho", brand: "NOBLE", name: "NOBLE 有楽町マルイ店", building: "yurakuchomarui",
      floor: "2F", level: 2, hours: "11:00–20:00", status: "ok",
      alt: "備案", tags: ["服飾"] },
    // ── C
    { id: "lf-lumineest", brand: "LOWRYS FARM", name: "LOWRYS FARM ルミネエスト", building: "lumineest",
      floor: "2F", level: 2, hours: "平日 11–21／六日 10:30–21", status: "ok",
      alt: "", tags: ["服飾"] },
    { id: "ht-lumineest", brand: "Heather", name: "Heather ルミネエスト", building: "lumineest",
      floor: "2F", level: 2, hours: "同上（平日 11–21／六日 10:30–21）", status: "ok",
      alt: "和 LOWRYS FARM 同層", tags: ["服飾"] },
    { id: "3c-lumineest", brand: "3COINS", name: "3COINS ルミネエスト新宿店", building: "lumineest",
      floor: "3F", level: 3, hours: "同上（平日 11–21／六日 10:30–21）", status: "ok",
      alt: "", tags: ["雜貨", "生活"] },
    { id: "vis-lumineest", brand: "VIS", name: "VIS ルミネエスト", building: "lumineest",
      floor: "3F", level: 3, hours: "同上（平日 11–21／六日 10:30–21）", status: "ok",
      alt: "和 3COINS 同層", tags: ["服飾"] },
    { id: "ll-shinjuku", brand: "Lululemon", name: "lululemon Tokyo Shinjuku Marui", building: "shinjukumrui",
      floor: "1F", level: 1, hours: "11:00–21:00", status: "ok",
      alt: "", tags: ["服飾", "運動"] },
    { id: "tf-lumine2", brand: "TODAYFUL", name: "STUDIOUS WOMENS 新宿", building: "lumine2",
      floor: "2F", level: 2, hours: "11:00–21:00", status: "ok",
      alt: "代售 TODAYFUL", tags: ["服飾"] },
    { id: "noble-lumine2", brand: "NOBLE", name: "NOBLE ルミネ新宿店", building: "lumine2",
      floor: "2F", level: 2, hours: "11:00–21:00", status: "ok",
      alt: "和 STUDIOUS 同層", tags: ["服飾"] },
    { id: "nel-newoman", brand: "Le Labo", name: "ル ラボ ニュウマン新宿", building: "newoman",
      floor: "1F", level: 1, hours: "週一至六 11:00–20:30／日・祝 11:00–20:00", status: "ok",
      alt: "", tags: ["香氛"] },
    { id: "hoka-lbreath", brand: "HOKA", name: "エルブレス新宿店（授權店）", building: "lbreath",
      floor: "◇ 官網沒寫樓層", level: 1.5, hours: "平日・六 11:00–20:00／日・祝 10:30–19:30", status: "check",
      alt: "HOKA 在鞋類賣場分層，1F–3F 範圍，以現場導覽為準", tags: ["鞋", "運動"] },
    { id: "hoka-yodo", brand: "HOKA", name: "アートスポーツ ヨドバシ新宿西口店", building: "yodoshinjuku",
      floor: "B1F/B2F", level: 0, hours: "09:30–22:00", status: "check",
      alt: "補 HOKA 更快的選擇，開到很晚", tags: ["鞋", "運動", "遲開"] },
    // ── D
    { id: "hoka-shibuya", brand: "HOKA", name: "HOKA SHIBUYA", building: "kca",
      floor: "1F–3F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "3 層旗艦店，2025.12 新開", tags: ["鞋", "運動"] },
    { id: "mb-shibuya", brand: "Mont-bell", name: "モンベル 渋谷店", building: "montshibuya",
      floor: "B1–4F", level: 0, hours: "10:30–21:00", status: "ok",
      alt: "女裝 3F、男裝 1–2F、鞋／背包 4F、露營 B1", tags: ["服飾", "鞋", "背包", "露營"] },
    { id: "ll-shibuya", brand: "Lululemon", name: "lululemon Shibuya", building: "llshibuya",
      floor: "◇ 路面店", level: 2, hours: "11:00–21:00", status: "check",
      alt: "路面店，以現場樓層導覽為準", tags: ["服飾", "運動"] },
    { id: "nel-shibuya", brand: "Le Labo", name: "ル ラボ 渋谷パルコ", building: "shibuparco",
      floor: "1F", level: 1, hours: "11:00–21:00", status: "ok",
      alt: "", tags: ["香氛"] },
    { id: "noble-hikarie", brand: "NOBLE", name: "NOBLE 渋谷ヒカリエ ShinQs 店", building: "hikarie",
      floor: "3F", level: 3, hours: "週一至六 11:00–21:00／日・祝 11:00–20:00", status: "ok",
      alt: "備案", tags: ["服飾"] },
    // ── E
    { id: "hoka-harajuku", brand: "HOKA", name: "HOKA Harajuku", building: "greenfantasia",
      floor: "1F–2F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "", tags: ["鞋", "運動"] },
    { id: "tf-studious-aoyama", brand: "TODAYFUL", name: "STUDIOUS WOMENS 表參道店", building: "studiousaoyama",
      floor: "◇ 路面店", level: 1, hours: "11:00–21:00", status: "check",
      alt: "路面店，以現場樓層導覽為準", tags: ["服飾"] },
    { id: "nel-harajuku", brand: "Le Labo", name: "ル ラボ 原宿", building: "lelaboharajuku",
      floor: "◇ 街邊店", level: 1, hours: "11:00–20:00", status: "check",
      alt: "街邊店，以現場樓層導覽為準", tags: ["香氛"] },
    { id: "nel-aoyama", brand: "Le Labo", name: "ル ラボ 青山", building: "lelaboaoyama",
      floor: "◇ 街邊店", level: 1, hours: "11:00–20:00", status: "check",
      alt: "街邊店，以現場樓層導覽為準", tags: ["香氛"] },
    { id: "ll-aoyama", brand: "Lululemon", name: "lululemon Tokyo Aoyama", building: "hcube",
      floor: "1F", level: 1, hours: "11:00–20:00", status: "ok",
      alt: "另有 2F", tags: ["服飾", "運動"] },
    { id: "ll-harajuku-flag", brand: "Lululemon", name: "ルルレモン原宿", building: "quest",
      floor: "1F–2F", level: 1, hours: "10:30–20:00", status: "ok",
      alt: "2026.8.19 開幕，日本首間全球旗艦店", tags: ["服飾", "運動"] },
    // ── F
    { id: "mb-okachimachi", brand: "Mont-bell", name: "モンベル 御徒町店", building: "comterrace",
      floor: "1F–4F", level: 1, hours: "10:00–21:00，無休", status: "ok",
      alt: "1F 男裝、2F 女裝／童裝／帽子手套、3F 露營／鞋／背包／單車／攀岩、4F 沙龍", tags: ["服飾", "鞋", "背包", "露營"] },
    { id: "3c-ecute", brand: "3COINS", name: "3COINS エキュート上野店", building: "ecute",
      floor: "3F（入谷改札內）", level: 3, hours: "8:00–21:00（週五到 22:00）", status: "ok",
      alt: "改札內，早開", tags: ["雜貨", "生活", "早開"] },
    { id: "hoka-art", brand: "HOKA", name: "アートスポーツ 本店（授權店）", building: "parkplace",
      floor: "1F–2F", level: 1, hours: "10:00–20:00，無休", status: "ok",
      alt: "鞋類在 1F", tags: ["鞋", "運動"] },
    // ── G 越後湯澤
    { id: "cocolo-ichiba", brand: "中央いちば", name: "がんぎどおり 中央いちば", building: "cocolo",
      floor: "1F", level: 1, hours: "9:00–19:00", status: "ok",
      alt: "便當、熟食、生鮮、地酒一次買齊", tags: ["超市", "熟食", "土產"] },
    { id: "ponshukan-shop", brand: "ぽんしゅ館", name: "ぽんしゅ館 魚沼商店", building: "cocolo",
      floor: "1F", level: 1, hours: "9:00–19:00", status: "ok",
      alt: "新潟地酒、米菓、漬物", tags: ["土產", "酒"] },
    { id: "ponshukan-tasting", brand: "ぽんしゅ館", name: "越後乃酒蔵 利酒番所", building: "cocolo",
      floor: "1F", level: 1, hours: "9:00–19:00", status: "ok",
      alt: "500 円換 5 枚代幣，100 種清酒試飲", tags: ["酒", "體驗"] },
    { id: "noguchi-main", brand: "のぐち", name: "ショッピングセンターのぐち 本店", building: "noguchi",
      floor: "1F", level: 1, hours: "9:30–19:00", status: "ok",
      alt: "生鮮・肉魚・熟菜，店內有 100 円商店", tags: ["超市", "生鮮"] },
    { id: "noguchi-hearts", brand: "のぐち", name: "のぐち 湯沢ハーツ店", building: "noguchi-hearts",
      floor: "1F", level: 1, hours: "9:00–21:00", status: "ok",
      alt: "品項最多，徒步約 20 分", tags: ["超市", "生鮮"] },
    { id: "matsukiyo-yuzawa", brand: "マツモトキヨシ", name: "マツモトキヨシ 越後湯沢駅前店", building: "matsukiyo",
      floor: "1F", level: 1, hours: "9:00–21:00", status: "ok",
      alt: "東口出站左轉即到", tags: ["藥妝", "日用品"] },
    { id: "seven-yuzawa", brand: "セブン-イレブン", name: "セブン-イレブン 越後湯沢西口店", building: "seven-yuzawa",
      floor: "1F", level: 1, hours: "24 小時", status: "ok",
      alt: "西口徒步 1 分，站外唯一便利店", tags: ["便利店", "24h"] }
  ];

  // 原文「> 走法」段落轉成可勾選的路線
  const plans = [
    { area: "shinjuku", title: "新宿主力路線", time: "8 個品牌",
      rule: "ルミネエスト 2F → 3F → ルミネ新宿2 2F → NEWoMan 1F → 新宿マルイ 1F，彼此步行 5–8 分鐘。",
      steps: ["lf-lumineest", "ht-lumineest", "3c-lumineest", "vis-lumineest", "tf-lumine2", "noble-lumine2", "nel-newoman", "ll-shinjuku"] },
    { area: "ginza", title: "銀座 1F 連逛", time: "約 30 分鐘",
      rule: "銀座インズ2 的 1F：DISCOAT、AZUL、VIS 三間連著逛。",
      steps: ["disc-inzs2", "azul-inzs2", "vis-inzs2"] },
    { area: "ginza", title: "GINZA SIX 雙樓層", time: "1F ↔ 4F",
      rule: "Le Labo 1F → lululemon 4F，退稅統一到 1F 辦。",
      steps: ["nel-ginzasix", "ll-ginzasix"] },
    { area: "shibuya", title: "神南街區", time: "11:00 後",
      rule: "HOKA SHIBUYA（公園通り）→ lululemon Shibuya 同一條神南街區。",
      steps: ["hoka-shibuya", "ll-shibuya"] },
    { area: "aoyama", title: "表參道一走", time: "10–15 分鐘步行圈",
      rule: "沿著同一條路串完，從 HOKA 原宿走到 Lululemon 青山。",
      steps: ["hoka-harajuku", "ll-harajuku-flag", "tf-studious-aoyama", "nel-harajuku", "nel-aoyama", "ll-aoyama"] },
    { area: "ueno", title: "阿美橫町一趟", time: "上野 ↔ 御徒町",
      rule: "上野站到御徒町站中間就是阿美橫町，走一趟三間都能到；3COINS 改札內，先逛再出站。",
      steps: ["3c-ecute", "mb-okachimachi", "hoka-art"] },
    { area: "tokyo", title: "東京站單點", time: "4 小時足夠",
      rule: "八重洲南口走路 6 分到京橋，只排 Mont-bell 一間，避免趕場。",
      steps: ["mb-kyobashi"] }
  ];

  // 原文「快速判斷」表格
  const picks = [
    { area: "tokyo", brands: "Mont-bell", floors: "京橋 1F–2F" },
    { area: "ginza", brands: "lululemon、Le Labo、DISCOAT、AZUL、VIS、3COINS（＋NOBLE 備案）", floors: "GINZA SIX 1F+4F／インズ2 1F×3間／西銀座 2F" },
    { area: "shinjuku", brands: "LOWRYS FARM、Heather、3COINS、VIS、Lululemon、TODAYFUL、NOBLE、Le Labo（＋HOKA 備案）", floors: "ルミネエスト 2F+3F／ルミネ2 2F／NEWoMan 1F／マルイ 1F" },
    { area: "shibuya", brands: "HOKA、Mont-bell、Lululemon、Le Labo（＋NOBLE 備案）", floors: "HOKA 1–3F／モンベル B1–4F／パルコ 1F" },
    { area: "aoyama", brands: "HOKA、Le Labo×2、Lululemon×2、TODAYFUL（選品店）", floors: "HOKA 1–2F／Lululemon 青山 1F" },
    { area: "ueno", brands: "Mont-bell、3COINS（＋HOKA 授權店）", floors: "モンベル 1–4F／ecute 3F／アートスポーツ 1–2F" }
  ];

  const brands = [
    { id: "HOKA", label: "HOKA", kind: "鞋 · 運動" },
    { id: "Lululemon", label: "lululemon", kind: "服飾 · 運動" },
    { id: "Mont-bell", label: "Mont-bell", kind: "戶外" },
    { id: "Le Labo", label: "Le Labo", kind: "香氛" },
    { id: "3COINS", label: "3COINS", kind: "雜貨" },
    { id: "VIS", label: "VIS", kind: "服飾" },
    { id: "LOWRYS FARM", label: "LOWRYS FARM", kind: "服飾" },
    { id: "Heather", label: "Heather", kind: "服飾" },
    { id: "TODAYFUL", label: "TODAYFUL", kind: "服飾 · 選品代售" },
    { id: "DISCOAT", label: "DISCOAT", kind: "服飾" },
    { id: "AZUL by MOUSSY", label: "AZUL by MOUSSY", kind: "服飾" },
    { id: "NOBLE", label: "NOBLE", kind: "服飾" },
    { id: "のぐち", label: "のぐち", kind: "超市" },
    { id: "中央いちば", label: "中央いちば", kind: "超市 · 熟食" },
    { id: "ぽんしゅ館", label: "ぽんしゅ館", kind: "地酒 · 土產" },
    { id: "マツモトキヨシ", label: "マツモトキヨシ", kind: "藥妝 · 日用品" },
    { id: "セブン-イレブン", label: "セブン-イレブン", kind: "便利店" }
  ];

  const meta = {
    title: "東京購物區域速查",
    subtitle: "含樓層 · 走到哪個區域、哪棟樓，就知道有哪幾間店可以逛",
    source: "東京購物區域速查_含樓層.md（官網／百貨官網，擷取於 2025–26 年）＋越後湯澤官網（2026-11）",
    updated: "2026-11"
  };

  return { areas, buildings, stores, plans, picks, brands, meta };
})();