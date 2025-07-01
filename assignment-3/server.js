const express = require('express');

const app         = express();
const PORT        = process.env.PORT || 3000;
const ROLL_NUMBER = '27100245';
const BACKEND_URL = 'https://assignment3.rohanhussain.com';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});


app.use(express.json());

app.use(express.static(__dirname, { extensions: ['html'] }));

app.get('/api/books', async (req, res) => {
  try {
    const url = `${BACKEND_URL}/api/books/${ROLL_NUMBER}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books', details: err.message });
  }
});

app.get('/api/books/search', async (req, res) => {
  const q = req.query.query;
  console.log('Full query object:', req.query);
  console.log('Full URL:', req.url);
  if (!q) return res.status(400).json({ error: 'Search query is required'});

try {
    // 2) Use `?query=` upstream
    const url = `${BACKEND_URL}/api/books/${ROLL_NUMBER}/search?query=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Upstream status ${response.status}`);

    // 3) Unwrap the nested wrapper
    const payload = await response.json();                  
    const books   = Array.isArray(payload.result?.books)
                    ? payload.result.books
                    : [];

    // Send back a pure array
    res.json(books);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search books', details: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  const { title, author, coverImageUrl, price } = req.body;
  if (!title || !author || !coverImageUrl || price === undefined) {
    return res
      .status(400)
      .json({ error: 'title, author, coverImageUrl and price are required' });
  }

  try {
    const url = `${BACKEND_URL}/api/books/${ROLL_NUMBER}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`Status ${response.status}: ${msg}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book', details: err.message });
  }
});

app.listen(PORT);
