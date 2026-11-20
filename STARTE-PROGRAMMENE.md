# Slik starter du programmene

Repoet: https://github.com/darkwigs2075-max/ki-utvikling

## For deg som har prosjektet lokalt

### Sjakk (`sjakk/`)
Krever ingen installasjon eller server.

1. Åpne mappen `sjakk` i filutforskeren.
2. Dobbeltklikk `index.html`. Den åpnes i nettleseren.

Eller fra terminalen:

```powershell
cd sjakk
start index.html
```

### Norgesquiz (`oppgave-3-3/`)
Krever [Node.js](https://nodejs.org) (versjon 18 eller nyere).

```powershell
cd oppgave-3-3
npm install     # bare første gang
npm start
```

Åpne deretter http://localhost:3000 i nettleseren.
Stopp serveren med `Ctrl + C` i terminalen.
Resultatene lagres i `oppgave-3-3/data.json`.

## For andre som vil prøve det

1. Installer [Git](https://git-scm.com) og [Node.js](https://nodejs.org) (Node trengs bare for quizen).
2. Hent koden:

```powershell
git clone https://github.com/darkwigs2075-max/ki-utvikling.git
cd ki-utvikling
```

3. Start sjakk eller quiz som beskrevet over.
   `node_modules` følger ikke med i Git, så `npm install` må kjøres i `oppgave-3-3` først.

Uten Git: trykk **Code → Download ZIP** på GitHub, pakk ut, og følg stegene over.

## Sjakk: slik bruker du det

- Klikk en brikke for å se lovlige trekk, og klikk på målruten for å flytte.
- To spillere deler samme skjerm. Hvit begynner.
- **Beste trekk** viser et forslag fra datamaskinen.
- **Angre**, **Snu brettet** og **Nytt parti** ligger ved siden av brettet.

## Feilsøking

- **`npm` finnes ikke:** Node.js er ikke installert, eller terminalen må startes på nytt etter installasjon.
- **Porten er i bruk:** Start på en annen port: `$env:PORT=3001; npm start`, og åpne `http://localhost:3001`.
- **Sjakkbrikkene vises ikke:** Mappen `sjakk/pieces/` må ligge ved siden av `index.html`.
