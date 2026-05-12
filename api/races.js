export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const JYO_NAMES = {
      '01':'桐生','02':'戸田','03':'江戸川','04':'平和島','05':'多摩川',
      '06':'浜名湖','07':'蒲郡','08':'常滑','09':'津','10':'三国',
      '11':'びわこ','12':'住之江','13':'尼崎','14':'鳴門','15':'丸亀',
      '16':'児島','17':'宮島','18':'徳山','19':'下関','20':'若松',
      '21':'芦屋','22':'福岡','23':'唐津','24':'大村'
    };

    const response = await fetch(
      `https://www.boatrace.jp/owpc/pc/race/topRace?hd=${dateStr}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Referer': 'https://www.boatrace.jp/',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // 開催場コードを抽出
    const jyoMatches = [...html.matchAll(/jcd=(\d{2})/g)];
    const jyoCodes = [...new Set(jyoMatches.map(m => m[1]))];

    const venues = jyoCodes
      .filter(c => JYO_NAMES[c])
      .map(c => ({ code: c, name: JYO_NAMES[c] }));

    return res.status(200).json({
      date: `${yyyy}/${mm}/${dd}`,
      venues: venues.length > 0 ? venues : [
        {code:'12',name:'住之江'},{code:'02',name:'戸田'},
        {code:'07',name:'蒲郡'},{code:'20',name:'若松'},
        {code:'22',name:'福岡'},{code:'04',name:'平和島'}
      ],
      count: venues.length,
      source: venues.length > 0 ? 'official' : 'fallback'
    });

  } catch (error) {
    // フォールバック: 取得失敗時は主要競艇場を返す
    return res.status(200).json({
      date: new Date().toLocaleDateString('ja-JP'),
      venues: [
        {code:'12',name:'住之江'},{code:'02',name:'戸田'},
        {code:'07',name:'蒲郡'},{code:'20',name:'若松'},
        {code:'22',name:'福岡'},{code:'04',name:'平和島'},
        {code:'05',name:'多摩川'},{code:'15',name:'丸亀'}
      ],
      count: 8,
      source: 'fallback',
      error: error.message
    });
  }
}
