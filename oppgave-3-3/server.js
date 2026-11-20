const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const MAX_SCORE = 5;

app.use(express.json({ limit: '1kb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function readScores() {
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('data.json må inneholde en liste');
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Skriver via midlertidig fil, og køer skrivinger så parallelle kall ikke overskriver hverandre.
let queue = Promise.resolve();
function addScore(entry) {
  const job = queue.then(async () => {
    const scores = await readScores();
    scores.push(entry);
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(scores, null, 2));
    await fs.rename(tmp, DATA_FILE);
  });
  queue = job.catch(() => {});
  return job;
}

app.get('/api/highscores', async (req, res) => {
  try {
    const scores = await readScores();
    scores.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
    res.json(scores.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente highscore-listen.' });
  }
});

app.post('/api/highscores', async (req, res) => {
  const { name, score } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (!cleanName || cleanName.length > 30) {
    return res.status(400).json({ error: 'Navnet må være mellom 1 og 30 tegn.' });
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ error: `Poengsummen må være et heltall mellom 0 og ${MAX_SCORE}.` });
  }
  const entry = { name: cleanName, score, date: new Date().toISOString() };
  try {
    await addScore(entry);
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke lagre poengsummen.' });
  }
});

app.use((err, req, res, next) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Noe gikk galt på serveren.' : 'Ugyldig forespørsel.' });
});

app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));
