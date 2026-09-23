export default async function handler(req, res) {
  const gasUrl = process.env.GAS_URL;

  if (!gasUrl) {
    return res.status(500).json({ error: 'GAS_URL is not configured' });
  }

  try {
    const gasRes = await fetch(gasUrl, { redirect: 'follow' });
    const text = await gasRes.text();

    // HtmlServiceのレスポンスからJSONを抽出
    const match = text.match(/\{[^}]+\}/);
    if (match) {
      const data = JSON.parse(match[0]);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    }

    return res.status(500).json({ error: 'JSONが見つかりません', raw: text.slice(0, 200) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
