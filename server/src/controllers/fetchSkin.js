import fetch from 'node-fetch';

export default async function fetchSkin(req, res) {
  const { name } = req.params;

  // Input validation
  if (!name || !/^[a-zA-Z0-9_]+$/.test(name) || name.length > 36) {
    return res.status(400).json({ error: 'Invalid username or UUID' });
  }

  const url = `https://mineskin.eu/skin/${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SkinAnvil/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');

    // Validate content type
    if (!contentType || !contentType.includes('image/')) {
      throw new Error('Invalid content type received');
    }

    const data = await response.arrayBuffer();

    // Set secure headers
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', contentType);

    const imgBuffer = Buffer.from(data);
    res.send(imgBuffer);
  } catch (error) {
    console.error('Failed to fetch skin:', error);
    res.status(500).json({ error: 'Failed to fetch skin' });
  }
}
