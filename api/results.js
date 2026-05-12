export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { jcd, hd } = req.query;
  if (!jcd || !hd) {
    return res.status(400).json({ error: 'jcd and hd are required' });
  }

  try {
    const results = [];

    for (let race = 1; race <= 12; race++) {
      const url = `https://www.boatrace.jp/owpc/pc/race/raceresult?rno=${race}&jcd=${jcd}&hd=${hd}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        }
      });

      const html = await response.text();

      // 3連単の払戻金を抽出
      const sanrenMatch = html.match(/3連単[\s\S]*?(\d+-\d+-\d+)[\s\S]*?¥?([\d,]+)/);
      
      if (sanrenMatch) {
        results.push({
          race: race,
          type: '3連単',
          kaimoku: sanrenMatch[1],
          refund: parseInt(sanrenMatch[2].replace(/,/g, ''))
        });
      }
    }

    res.status(200).json({ jcd, hd, results });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
