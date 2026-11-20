const questions = [
  { q: 'Hva er Norges lengste elv?', a: ['Glomma', 'Tana', 'Numedalslågen', 'Drammenselva'], c: 0 },
  { q: 'Hva heter Norges høyeste fjell?', a: ['Snøhetta', 'Galdhøpiggen', 'Store Skagastølstind', 'Glittertind'], c: 1 },
  { q: 'Hvilken by kalles «Regnbyen»?', a: ['Stavanger', 'Tromsø', 'Bergen', 'Kristiansand'], c: 2 },
  { q: 'Hvilket år ble Norge selvstendig fra Sverige?', a: ['1814', '1905', '1945', '1884'], c: 1 },
  { q: 'Hvilken av disse byene ligger lengst nord?', a: ['Bodø', 'Tromsø', 'Trondheim', 'Narvik'], c: 1 },
];

const $ = (id) => document.getElementById(id);
let index = 0;
let score = 0;

function show(section) {
  for (const id of ['quiz', 'finish', 'highscores']) $(id).hidden = id !== section;
}

function renderQuestion() {
  const item = questions[index];
  $('progress').textContent = `Spørsmål ${index + 1} av ${questions.length}`;
  $('meter').style.width = `${(index / questions.length) * 100}%`;
  $('question').textContent = item.q;
  $('answers').replaceChildren(...item.a.map((text, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = text;
    btn.addEventListener('click', () => answer(i));
    return btn;
  }));
}

function answer(i) {
  const correct = questions[index].c;
  const buttons = [...$('answers').children];
  buttons.forEach((b) => (b.disabled = true));
  buttons[correct].classList.add('correct');
  if (i === correct) score++;
  else buttons[i].classList.add('wrong');
  setTimeout(() => {
    index++;
    if (index < questions.length) renderQuestion();
    else finish();
  }, 900);
}

function finish() {
  $('result').textContent = `Du fikk ${score} av ${questions.length} riktige.`;
  $('error').textContent = '';
  show('finish');
  $('name').focus();
}

async function loadScores(saved) {
  const list = $('score-list');
  try {
    const res = await fetch('/api/highscores');
    if (!res.ok) throw new Error();
    const scores = await res.json();
    list.replaceChildren(...scores.map((s) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      const points = document.createElement('span');
      name.textContent = s.name;
      points.textContent = `${s.score} av ${questions.length}`;
      points.className = 'points';
      li.append(name, points);
      if (saved && s.date === saved.date) li.className = 'me';
      return li;
    }));
    if (!scores.length) list.textContent = 'Ingen resultater ennå. Spill en runde.';
  } catch {
    list.textContent = 'Kunne ikke hente highscore-listen. Prøv å laste siden på nytt.';
  }
}

$('score-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').textContent = '';
  try {
    const res = await fetch('/api/highscores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('name').value.trim(), score }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    await loadScores(body);
    show('highscores');
  } catch (err) {
    $('error').textContent = err.message || 'Noe gikk galt.';
  }
});

$('restart').addEventListener('click', () => {
  index = 0;
  score = 0;
  $('name').value = '';
  renderQuestion();
  show('quiz');
});

renderQuestion();
show('quiz');
