const NAMES = { K: 'konge', Q: 'dronning', R: 'tårn', B: 'løper', N: 'springer', P: 'bonde' };
const $ = (id) => document.getElementById(id);

let state;
let history;
let moveLog;
let selected;
let flipped = false;
let lastMove;
let hint = null;

function newGame() {
  hint = null;
  state = Chess.initial();
  history = [];
  moveLog = [];
  selected = null;
  lastMove = null;
  render();
}

function render() {
  const board = $('board');
  const status = Chess.status(state);
  const kingSquare = Chess.inCheck(state) ? Chess.findKing(state.board, state.turn) : null;
  const targets = selected ? Chess.legalMoves(state, selected[0], selected[1]) : [];
  const squares = [];

  for (let i = 0; i < 64; i++) {
    const r = flipped ? 7 - Math.floor(i / 8) : Math.floor(i / 8);
    const c = flipped ? 7 - (i % 8) : i % 8;
    const piece = state.board[r][c];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sq ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
    btn.dataset.r = r;
    btn.dataset.c = c;
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `${Chess.square([r, c])}${piece ? ', ' + (piece[0] === 'w' ? 'hvit ' : 'svart ') + NAMES[piece[1]] : ''}`);

    if (selected && selected[0] === r && selected[1] === c) btn.classList.add('selected');
    if (lastMove && [lastMove.from, lastMove.to].some(([lr, lc]) => lr === r && lc === c)) btn.classList.add('last');
    if (hint && [hint.from, hint.to].some(([hr, hc]) => hr === r && hc === c)) btn.classList.add('best');
    if (kingSquare && kingSquare[0] === r && kingSquare[1] === c) btn.classList.add('check');
    if (targets.some((m) => m.to[0] === r && m.to[1] === c)) {
      btn.classList.add('hint');
      if (piece) btn.classList.add('capture');
    }

    if (piece) btn.append(pieceImg(piece));
    if (i % 8 === 0) addCoord(btn, 'rank', 8 - r);
    if (i >= 56) addCoord(btn, 'file', 'abcdefgh'[c]);
    btn.addEventListener('click', () => onSquare(r, c));
    squares.push(btn);
  }
  board.replaceChildren(...squares);

  renderMoves();
  renderStatus(status);
  $('undo').disabled = history.length === 0;
  $('hint').disabled = status.over;
  if (!hint) $('hint-text').textContent = '';
}

function showHint() {
  $('hint-text').textContent = 'Tenker …';
  $('hint').disabled = true;
  setTimeout(() => {
    const best = AI.bestMove(state, 3);
    if (!best) return render();
    hint = best.move;
    const next = Chess.apply(state, best.move);
    const mate = Math.abs(best.score) > AI.MATE - 100;
    const pawns = (best.score / 100).toFixed(1);
    const evalText = mate ? (best.score > 0 ? 'fører til matt' : 'taper til matt') : `vurdering ${best.score > 0 ? '+' : ''}${pawns} for ${state.turn === 'w' ? 'hvit' : 'svart'}`;
    render();
    $('hint-text').textContent = `Beste trekk: ${Chess.notation(state, best.move, next)} (${evalText})`;
  }, 30);
}

$('hint').addEventListener('click', showHint);

function pieceImg(piece) {
  const img = document.createElement('img');
  img.className = 'piece';
  img.src = `pieces/${piece}.svg`;
  img.alt = '';
  img.draggable = false;
  return img;
}

function addCoord(btn, kind, text) {
  const el = document.createElement('span');
  el.className = `coord ${kind}`;
  el.textContent = text;
  btn.append(el);
}

function renderMoves() {
  const items = [];
  for (let i = 0; i < moveLog.length; i += 2) {
    const li = document.createElement('li');
    li.textContent = [moveLog[i], moveLog[i + 1]].filter(Boolean).join('   ');
    items.push(li);
  }
  $('moves').replaceChildren(...items);
  $('moves').scrollTop = $('moves').scrollHeight;
}

function renderStatus(status) {
  const side = state.turn === 'w' ? 'Hvit' : 'Svart';
  const el = $('status');
  el.className = '';
  if (!status.over) {
    el.textContent = status.check ? `${side} står i sjakk.` : `${side} sin tur.`;
    if (status.check) el.className = 'alert';
    return;
  }
  el.className = 'alert';
  el.textContent = {
    checkmate: `Sjakkmatt. ${status.winner === 'w' ? 'Hvit' : 'Svart'} vinner.`,
    stalemate: 'Patt. Partiet er remis.',
    insufficient: 'Remis. Ingen av sidene kan sette matt.',
    fifty: 'Remis etter 50-trekksregelen.',
  }[status.result];
}

function onSquare(r, c) {
  if (Chess.status(state).over) return;
  if (selected) {
    const candidates = Chess.legalMoves(state, selected[0], selected[1]).filter((m) => m.to[0] === r && m.to[1] === c);
    if (candidates.length) {
      if (candidates[0].promo) choosePromotion(candidates);
      else play(candidates[0]);
      return;
    }
  }
  const piece = state.board[r][c];
  selected = piece && piece[0] === state.turn ? [r, c] : null;
  render();
}

function choosePromotion(candidates) {
  const choices = $('promo-choices');
  const color = state.turn;
  choices.replaceChildren(...candidates.map((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = '';
    btn.append(pieceImg(color + m.promo));
    btn.setAttribute('aria-label', NAMES[m.promo]);
    btn.addEventListener('click', () => {
      $('promo').close();
      play(m);
    });
    return btn;
  }));
  $('promo').showModal();
}

function play(move) {
  const next = Chess.apply(state, move);
  history.push({ state, moveLog: moveLog.slice(), lastMove });
  moveLog.push(Chess.notation(state, move, next));
  state = next;
  lastMove = move;
  selected = null;
  hint = null;
  render();
}

$('undo').addEventListener('click', () => {
  const prev = history.pop();
  if (!prev) return;
  ({ state, moveLog, lastMove } = prev);
  selected = null;
  hint = null;
  render();
});
$('flip').addEventListener('click', () => {
  flipped = !flipped;
  render();
});
$('restart').addEventListener('click', () => {
  if (!history.length || confirm('Starte et nytt parti?')) newGame();
});

newGame();
