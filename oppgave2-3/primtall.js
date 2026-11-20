function nktePrimtall(n) {
  if (n < 1) throw new RangeError("n må være minst 1");
  // Øvre grense for p_n (gyldig for n >= 6): n * (ln n + ln ln n)
  const grense = n < 6 ? 15 : Math.ceil(n * (Math.log(n) + Math.log(Math.log(n))));
  const sil = new Uint8Array(grense + 1); // 1 = sammensatt
  let teller = 0;
  for (let i = 2; i <= grense; i++) {
    if (sil[i]) continue;
    if (++teller === n) return i;
    if (i * i <= grense) {
      for (let j = i * i; j <= grense; j += i) sil[j] = 1;
    }
  }
}

const n = Number(process.argv[2] ?? 10000);
const start = process.hrtime.bigint();
const resultat = nktePrimtall(n);
const ms = Number(process.hrtime.bigint() - start) / 1e6;
console.log(`Primtall nr. ${n} er ${resultat} (${ms.toFixed(1)} ms)`);
