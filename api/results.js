export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { jcd, hd } = req.query;
  if (!jcd || !hd) {
    return res.status(400).json({ error: 'jcd and hd are required' });
  }

  const results = [];

  for (let race = 1; race <= 12; race++) {
    try {
      const url = `https://www.boatrace.jp/owpc/pc/race/raceresult?rno=${race}&jcd=${jcd.padStart(2,'0')}&hd=${hd}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja',
          'Referer': 'https://www.boatrace.jp/',
        }
      });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const html = await response.text();

      // 3連単の組番を抽出 (例: 1-2-3)
      const kaimokuPatterns = [
        /class="numberSet1_number[\s\S]*?(\d)\s*[\s\S]*?(\d)\s*[\s\S]*?(\d)/,
        /sanren.*?(\d)-(\d)-(\d)/i,
        /3連単[\s\S]{0,200}?(\d-\d-\d)/,
        /(\d)-(\d)-(\d)[\s\S]{0,50}?([1-9]\d{2,6})/
      ];

      let kaimoku = null;
      for (const pat of kaimokuPatterns) {
        const m = html.match(pat);
        if (m) {
          kaimoku = m[1] + '-' + m[2] + '-' + m[3];
          break;
        }
      }

      // 払戻金を抽出
      const refundPatterns = [
        /¥([\d,]+)/,
        /([1-9][\d,]{2,8})円/,
        /払戻[\s\S]{0,100}?([1-9]\d{2,6})/
      ];

      let refund = null;
      for (const pat of refundPatterns) {
        const m = html.match(pat);
        if (m) {
          refund = parseInt(m[1].replace(/,/g, ''));
          if (refund > 100 && refund < 10000000) break;
          refund = null;
        }
      }

      if (kaimoku && refund) {
        results.push({ race, type: '3連単', kaimoku, refund });
      } else if (html.includes('raceresult') || html.includes('レース結果')) {
        // ページは存在するが結果が取れない場合
        results.push({ race, type: '3連単', kaimoku: '取得中', refund: 0 });
      }

    } catch(e) {
      // タイムアウトや接続エラーはスキップ
      continue;
    }
  }

  return res.status(200).json({ 
    jcd, 
    hd, 
    results,
    total: results.length
  });
}
