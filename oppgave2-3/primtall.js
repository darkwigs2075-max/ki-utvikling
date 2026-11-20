function erPrimtall(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function nteTrimtall(n) {
  let teller = 0;
  let kandidat = 1;
  while (teller < n) {
    kandidat++;
    if (erPrimtall(kandidat)) teller++;
  }
  return kandidat;
}

console.log("Primtall nr. 10 000 er", nteTrimtall(10000));
