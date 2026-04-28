export default async function handler(req, res) {
  const GAS_URL =
    'https://script.google.com/macros/s/AKfycbyZseKn9rTVgRD9rtt6c6ozQvIWQbaLWwcVaop-T1pakJXTM-LYMkgCMw1qeIahSFYVIw/exec';

  try {
    const gasRes = await fetch(GAS_URL, { redirect: 'follow' });
    const text = await gasRes.text();

    // HtmlServiceのレスポンスからJSONを抽出
    const match = text.match(/\{[^}]+\}/);
    if (match) {
      const data = JSON.parse(match[0]);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json(data);
    } else {
      res.status(500).json({ error: 'JSONが見つかりません', raw: text.slice(0, 200) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
