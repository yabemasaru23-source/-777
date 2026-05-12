export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    // ボートレース公式 開催場一覧
    const url = `https://www.boatrace.jp/owpc/pc/race/topRace?hd=${dateStr}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9',
      }
    });

    const html = await response.text();

    // 開催場を抽出
    const jyoMatches = html.match(/jcd=(\d{2})/g) || [];
    const jyoCodes = [...new Set(jyoMatches.map(m => m.replace('jcd=', '')))];

    const JYO_NAMES = {
      '01':'桐生','02':'戸田','03':'江戸川','04':'平和島','05':'多摩川',
      '06':'浜名湖','07':'蒲郡','08':'常滑','09':'津','10':'三国',
      '11':'びわこ','12':'住之江','13':'尼崎','14':'鳴門','15':'丸亀',
      '16':'児島','17':'宮島','18':'徳山','19':'下関','20':'若松',
      '21':'芦屋','22':'福岡','23':'唐津','24':'大村'
    };

    const venues = jyoCodes
      .filter(c => JYO_NAMES[c])
      .map(c => ({ code: c, name: JYO_NAMES[c] }));

    res.status(200).json({
      date: `${yyyy}/${mm}/${dd}`,
      venues: venues,
      count: venues.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
