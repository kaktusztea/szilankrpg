## Védő Érték csökkentése (TÉ < VÉ)

Harcban sikertelennek számít támadásod, ha a **Támadó dobásod** végső értéke nem éri el ellenfeled **Védő Értékét**.

Ebben az esetben viszont ideiglenesen **csökkented ellenfeled Védő Értékét** - a fáradást szimulálva, hiszen a harc, a védekezés komolyan igénybe veszik az védekező figyelmét, szellemi képességeit és állóképességét. Minél tovább tart a harc, annál veszélyesebbé válik a harc a folyamatosan csökkenő `VÉ` csökkenés miatt. Egy tapasztalt harcos magasabb `Védő Értékkel` indul, így ő tovább képes magas szinten teljesíteni, de például több ellenfél ellen ő is hamar kifulladhat - mindenki folyamatosan csökkent rajta Védő Értéket - és váratlan vereséget szenvedhet.

Hogy konkrétan milyen mértékben csökkented ellenfeled `Védő Értékét`, az fegyvereitek pengehossz-különbségétől függ. Értelemszerűen a nagyobb pengehosszal rendelkező fél van előnyben. A fegyverméretekről bővebben [itt olvashatsz](068_01_00_fegyverek_altalanos_szabalyai.md).

A fentiek adminisztrálása elsőre plusz teherként tűnhet fel, valójában viszont a csökkenő `VÉ` rövidebb harcokat eredményez - főleg több ellenfél ellen küzdve, ami gyors vereséghez vezethet.

Az aktuális fegyverméretek különbségét Harci helyzetekkel (harci státuszokkal) modellezzük.

### ⚜️ [Fegyverméret - pengehátrány](065_01_04_fegyver_harci_helyzetek.md#fegyverméret---pengehátrány)

- Fegyverméret különbség legalább `(-1)` pengehossz
-  [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x): `1 + k20T`

### ⚜️ [Fegyverméret - Azonos](065_01_04_fegyver_harci_helyzetek.md#fegyverméret---azonos)

- Fegyverméret különbség kisebb `1 pengehossznál`
- mindkét fél [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x): `2 + k20T`

### ⚜️ [Fegyverméret - 1 pengés előny](065_01_04_fegyver_harci_helyzetek.md#fegyverméret---1-pengés-előny)

- Fegyverméret különbség legalább `+1` pengehossz
- [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x): `2 + k20T`
- Példa: **Hosszú kard**  vs. **Tőr**
- Példa: **Alabárd** vs **Hosszú kard**

### ⚜️ [Fegyverméret - 2 pengés előny](065_01_04_fegyver_harci_helyzetek.md#fegyverméret---2-pengés-előny)

- Fegyverméret különbség legalább `+2` pengehossz
- [VÉ csökkentés](081_hatasok.md#-v%C3%A9-cs%C3%B6kkent%C3%A9s-x): `3 + k20T`
- Példa: **Kétkezes kard** vs **Tőr**
- Példa: **Lándzsa** vs **Rövidkard**

---
### Több támadó és harci taktikák jelentősége - a VÉ csökkentés fényében

A `VÉ` csökkentéses rendszer előnye, hogy a több támadó okozta fenyegetés sokkal fajsúlyosabb lesz, hiszen többen, sokkal gyorsabban “leverik” a karakter aktuális **Védő Értékét**. A támadások száma is sokat számít, részben a `VÉ` csökkentés szempontjából, másrészt a sokkal erősebb, több támadással rendelkező karakternek jó esélye van az első körben elintéznie gyengébb ellenfelét, még ha annak magas is a **Védő Értéke** (első egy/két támadás `VÉ`-t csökkent, aztán találat).

Megnő a [Támadó/Védő taktika](065_02_harci_taktikak.md#támadó-taktika) jelentősége is. Egy sebesült harcos ellen jó lehet a **Támadó taktika**, bár megvannak a veszélyei is, váratlan vereséghez is vezethet. A harc elején pedig – ha az idő engedi – hasznos lehet a védekezést preferáló taktikát választani, kivéve, ha nem sietős az ellenfél elintézése. A megfelelő harcmodorok kombinálása is színessé, izgalmassá teszi a küzdelmet.

---
### VÉ csökkenés mérséklése

🔆 Az áldozat VÉ csökkenését a [Harcos Elme](fortelyok.harci/harcos_elme.md) fortély tanulása képes mérsékelni.

---

🔗 [Találat](064_02_04_talalat.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
