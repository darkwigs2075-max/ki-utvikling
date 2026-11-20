const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Skriv inn et tall: ", (svar) => {
  const tall = Number(svar.trim());

  if (svar.trim() === "" || !Number.isInteger(tall)) {
    console.log("Det er ikke et heltall.");
  } else if (tall % 2 === 0) {
    console.log(`${tall} er et partall.`);
  } else {
    console.log(`${tall} er et oddetall.`);
  }

  rl.close();
});
