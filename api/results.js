export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { jcd, hd } = req.query;
  if (!jcd || !hd) {
    return res.status(400).json({ error: 'jcd and hd are required' });
  }

  try {
    const results = [];

    for (let race = 1; race <= 12; race++) {
      try {
        const url = `https://www.boatrace.jp/owpc/pc/race/raceresult?rno=${race}&jcd=${jcd}&hd=${hd}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ja,en-US;q=0.9',
            'Referer': 'https://www.boatrace.jp/',
          }
        });

        if (!response.ok) continue;
        const html = await response.text();

        // 3連単を抽出: 数字-数字-数字のパターン
        const kaimokuMatch = html.match(/(\d-\d-\d)/);
        // 払戻金を抽出
        const refundMatch = html.match(/([1-9]\d{2,6})円/);

        if (kaimokuMatch && refundMatch) {
          results.push({
            race,
            type: '3連単',
            kaimoku: kaimokuMatch[1],
            refund: parseInt(refundMatch[1])
          });
        }
      } catch(e) {
        continue;
      }
    }

    return res.status(200).json({ jcd, hd, results });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
