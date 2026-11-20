const Chess = (() => {
  const BACK = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

  function initial() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      board[0][c] = 'b' + BACK[c];
      board[1][c] = 'bP';
      board[6][c] = 'wP';
      board[7][c] = 'w' + BACK[c];
    }
    return {
      board,
      turn: 'w',
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      ep: null,
      halfmove: 0,
      fullmove: 1,
    };
  }

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const opp = (color) => (color === 'w' ? 'b' : 'w');

  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function isAttacked(board, r, c, by) {
    const pawnRow = by === 'w' ? r + 1 : r - 1;
    for (const dc of [-1, 1]) {
      if (inBounds(pawnRow, c + dc) && board[pawnRow][c + dc] === by + 'P') return true;
    }
    for (const [dr, dc] of KNIGHT) {
      if (inBounds(r + dr, c + dc) && board[r + dr][c + dc] === by + 'N') return true;
    }
    for (const [dr, dc] of KING) {
      if (inBounds(r + dr, c + dc) && board[r + dr][c + dc] === by + 'K') return true;
    }
    const slide = (dirs, kinds) => {
      for (const [dr, dc] of dirs) {
        let rr = r + dr;
        let cc = c + dc;
        while (inBounds(rr, cc)) {
          const p = board[rr][cc];
          if (p) {
            if (p[0] === by && kinds.includes(p[1])) return true;
            break;
          }
          rr += dr;
          cc += dc;
        }
      }
      return false;
    };
    return slide(DIAG, 'BQ') || slide(ORTHO, 'RQ');
  }

  function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) if (board[r][c] === color + 'K') return [r, c];
    }
    return null;
  }

  function inCheck(state, color = state.turn) {
    const [r, c] = findKing(state.board, color);
    return isAttacked(state.board, r, c, opp(color));
  }

  function pseudoMoves(state, r, c) {
    const { board, castling, ep } = state;
    const piece = board[r][c];
    const color = piece[0];
    const kind = piece[1];
    const moves = [];
    const add = (tr, tc, extra = {}) => moves.push({ from: [r, c], to: [tr, tc], ...extra });

    if (kind === 'P') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const lastRow = color === 'w' ? 0 : 7;
      const push = (tr, tc, extra = {}) => {
        if (tr === lastRow) for (const promo of 'QRBN') add(tr, tc, { ...extra, promo });
        else add(tr, tc, extra);
      };
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        push(r + dir, c);
        if (r === startRow && !board[r + 2 * dir][c]) add(r + 2 * dir, c, { double: true });
      }
      for (const dc of [-1, 1]) {
        const tr = r + dir;
        const tc = c + dc;
        if (!inBounds(tr, tc)) continue;
        const target = board[tr][tc];
        if (target && target[0] !== color) push(tr, tc);
        else if (!target && ep && ep[0] === tr && ep[1] === tc) add(tr, tc, { ep: true });
      }
    } else if (kind === 'N' || kind === 'K') {
      for (const [dr, dc] of kind === 'N' ? KNIGHT : KING) {
        const tr = r + dr;
        const tc = c + dc;
        if (inBounds(tr, tc) && (!board[tr][tc] || board[tr][tc][0] !== color)) add(tr, tc);
      }
      if (kind === 'K') {
        const row = color === 'w' ? 7 : 0;
        if (r === row && c === 4 && !isAttacked(board, row, 4, opp(color))) {
          if (castling[color + 'K'] && board[row][7] === color + 'R' && !board[row][5] && !board[row][6]
              && !isAttacked(board, row, 5, opp(color))) {
            add(row, 6, { castle: 'K' });
          }
          if (castling[color + 'Q'] && board[row][0] === color + 'R' && !board[row][1] && !board[row][2]
              && !board[row][3] && !isAttacked(board, row, 3, opp(color))) {
            add(row, 2, { castle: 'Q' });
          }
        }
      }
    } else {
      const dirs = kind === 'B' ? DIAG : kind === 'R' ? ORTHO : [...DIAG, ...ORTHO];
      for (const [dr, dc] of dirs) {
        let tr = r + dr;
        let tc = c + dc;
        while (inBounds(tr, tc)) {
          const target = board[tr][tc];
          if (!target) add(tr, tc);
          else {
            if (target[0] !== color) add(tr, tc);
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    }
    return moves;
  }

  function apply(state, move) {
    const board = state.board.map((row) => row.slice());
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    const piece = board[fr][fc];
    const color = piece[0];
    const captured = move.ep ? board[fr][tc] : board[tr][tc];
    const castling = { ...state.castling };

    board[fr][fc] = null;
    if (move.ep) board[fr][tc] = null;
    board[tr][tc] = move.promo ? color + move.promo : piece;
    if (move.castle === 'K') {
      board[tr][5] = board[tr][7];
      board[tr][7] = null;
    } else if (move.castle === 'Q') {
      board[tr][3] = board[tr][0];
      board[tr][0] = null;
    }

    if (piece[1] === 'K') {
      castling[color + 'K'] = false;
      castling[color + 'Q'] = false;
    }
    const corners = { '7,0': 'wQ', '7,7': 'wK', '0,0': 'bQ', '0,7': 'bK' };
    for (const key of [`${fr},${fc}`, `${tr},${tc}`]) if (corners[key]) castling[corners[key]] = false;

    return {
      board,
      turn: opp(state.turn),
      castling,
      ep: move.double ? [(fr + tr) / 2, fc] : null,
      halfmove: piece[1] === 'P' || captured ? 0 : state.halfmove + 1,
      fullmove: state.fullmove + (state.turn === 'b' ? 1 : 0),
      captured,
    };
  }

  function legalMoves(state, r, c) {
    const piece = state.board[r][c];
    if (!piece || piece[0] !== state.turn) return [];
    return pseudoMoves(state, r, c).filter((m) => !inCheck(apply(state, m), piece[0]));
  }

  function allLegalMoves(state) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) moves.push(...legalMoves(state, r, c));
    }
    return moves;
  }

  function insufficientMaterial(board) {
    const pieces = [];
    for (const row of board) for (const p of row) if (p && p[1] !== 'K') pieces.push(p);
    if (pieces.length === 0) return true;
    return pieces.length === 1 && 'BN'.includes(pieces[0][1]);
  }

  function status(state) {
    const check = inCheck(state);
    if (allLegalMoves(state).length === 0) {
      return check ? { over: true, result: 'checkmate', winner: opp(state.turn) } : { over: true, result: 'stalemate' };
    }
    if (insufficientMaterial(state.board)) return { over: true, result: 'insufficient' };
    if (state.halfmove >= 100) return { over: true, result: 'fifty' };
    return { over: false, check };
  }

  const square = ([r, c]) => 'abcdefgh'[c] + (8 - r);

  function suffix(next) {
    const s = status(next);
    if (s.result === 'checkmate') return '#';
    return s.check ? '+' : '';
  }

  function notation(state, move, next) {
    if (move.castle) return (move.castle === 'K' ? 'O-O' : 'O-O-O') + suffix(next);
    const piece = state.board[move.from[0]][move.from[1]];
    const isCapture = move.ep || state.board[move.to[0]][move.to[1]];
    const letter = piece[1] === 'P' ? '' : piece[1];
    const promo = move.promo ? '=' + move.promo : '';
    return `${letter}${square(move.from)}${isCapture ? '×' : '–'}${square(move.to)}${promo}${suffix(next)}`;
  }

  function perft(state, depth) {
    if (depth === 0) return 1;
    let total = 0;
    for (const m of allLegalMoves(state)) total += perft(apply(state, m), depth - 1);
    return total;
  }

  return { initial, legalMoves, allLegalMoves, apply, status, notation, inCheck, findKing, perft, square };
})();

if (typeof module !== 'undefined') module.exports = Chess;
