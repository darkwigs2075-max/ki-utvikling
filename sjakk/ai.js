const AI = (() => {
  const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
  const MATE = 100000;

  function evaluate(state) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;
        const kind = piece[1];
        let v = VALUE[kind];
        if (kind === 'N' || kind === 'B' || kind === 'P') v += (7 - (Math.abs(3.5 - r) + Math.abs(3.5 - c))) * 4;
        if (kind === 'P') v += (piece[0] === 'w' ? 6 - r : r - 1) * 6;
        score += piece[0] === 'w' ? v : -v;
      }
    }
    return score;
  }

  function ordered(state) {
    const gain = (m) => {
      const target = m.ep ? 'P' : (state.board[m.to[0]][m.to[1]] || ' ')[1];
      return (VALUE[target] || 0) + (m.promo ? VALUE[m.promo] : 0);
    };
    return Chess.allLegalMoves(state)
      .map((m) => ({ m, g: gain(m) }))
      .sort((a, b) => b.g - a.g)
      .map((x) => x.m);
  }

  function quiesce(state, alpha, beta, depthLeft) {
    const stand = (state.turn === 'w' ? 1 : -1) * evaluate(state);
    if (depthLeft === 0 || stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    for (const m of ordered(state)) {
      const isCapture = m.ep || state.board[m.to[0]][m.to[1]];
      if (!isCapture) continue;
      const score = -quiesce(Chess.apply(state, m), -beta, -alpha, depthLeft - 1);
      if (score >= beta) return score;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function negamax(state, depth, alpha, beta, ply) {
    const moves = ordered(state);
    if (!moves.length) return Chess.inCheck(state) ? -MATE + ply : 0;
    if (depth === 0) return quiesce(state, alpha, beta, 4);
    let best = -Infinity;
    for (const m of moves) {
      const score = -negamax(Chess.apply(state, m), depth - 1, -beta, -alpha, ply + 1);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function bestMove(state, depth = 3) {
    let best = null;
    let alpha = -Infinity;
    for (const m of ordered(state)) {
      const score = -negamax(Chess.apply(state, m), depth - 1, -Infinity, -alpha, 1);
      if (!best || score > best.score) best = { move: m, score };
      if (score > alpha) alpha = score;
    }
    return best;
  }

  return { bestMove, MATE };
})();

if (typeof module !== 'undefined') module.exports = AI;
