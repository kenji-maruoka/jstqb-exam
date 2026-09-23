export default async function handler(req, res) {
  const gasUrl = process.env.GAS_FILE_LIST_URL;

  if (!gasUrl) {
    return res.status(500).json({ error: 'GAS_FILE_LIST_URL is not configured' });
  }

  try {
    const gasRes = await fetch(gasUrl, { redirect: 'follow' });
    const data = await gasRes.json();

    if (!gasRes.ok) {
      return res.status(gasRes.status).json({ error: data?.error || 'Failed to fetch spreadsheet list' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
