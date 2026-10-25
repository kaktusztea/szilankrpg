## Fegyver Extrák

Egyes fegyverek egyedi, szituációs hatásokat hordoznak - ezeket **extráknak** nevezzük. A fegyvertáblák "Extrák" oszlopa hivatkozik rájuk névvel - a hatás mindig szituációs (nem a alapértékeket módosít), és csak akkor lép életbe, ha a feltétele teljesül.

## Felkészítés

### Különleges felkészítés

```
Feltétel: Mesterfegyver fortély 1.fok az adott fegyverre
        + harci iskola (KM dönti el, narratív)
Hatás:    Mesterfegyver e fegyverre adott bónuszai megduplázódnak
```

A feltételek nélkül nem jár a bónusz. Lásd még: [Harci iskola](fortelyok.szabad/harci_iskola.md) 🔁 fortély.

<br />

---
## Harci helyzet (szituációs, automatikus)

### Beszorítható (enyhén)

```
Feltétel: Beszorítva harci helyzet
Hatás:    fegyver-járulék (alap+MF+Idea) TÉ/VÉ feleződik
```

Közepesen hosszú fegyver (hossz `5`): beszorítva csak részben forgatható.

### Beszorítható (nagyon)

```
Feltétel: Beszorítva harci helyzet
Hatás:    fegyver-járulék (alap+MF+Idea) TÉ/VÉ: 0
```

Hosszú fegyver (hossz `7` és felette): beszorítva nem forgatható rendesen. A karakter saját harcérték-része (tulajdonságok, harcmodor, harci fortélyok) változatlan.

### Páncéltalant jobban sebez

```
Feltétel: cél vérttelen
Hatás:    SP:+3
```

Vérttelen célon nagyobb sebet ejt. Példa: Meneth, Béltépő.

### Pocsék védekező (páncélos ellen)

```
Feltétel: cél páncélos
Hatás:    VÉ:0
```

Páncélos ellenfél ellen a hárítási hátrány kiütközik.

### Puszta kéz belharcban

```
Feltétel: Belharci helyzet
Hatás:    TÉ:0, VÉ:0, SP:0
```

Puszta kéz belharcban: a fegyvertelen büntetés megszűnik. Természetes fegyver fortéllyal az SP 1 marad.

### Belharcban rések közt beszúr

```
Feltétel: Belharci helyzet
Hatás:    Belharc fegyverhossz-korlát nem vonatkozik rá
          + földön fekvő ellenfélnél: célpont páncél SFÉ: 0
```

Belharcban a fegyverhossza ellenére is használható, földön lévő ellenfélnél a rések közt szúr.

### Pikás közrefogása

```
Feltétel: Közrefogás helyzet + választott támadó (KM/játékos)
Hatás:    TÉ:0, VÉ:0 az egyik (választott) támadó ellen
```

Ha pikával harcolsz és közrefognak, a fegyver az egyik támadó ellen `TÉ/VÉ:0` harcértékű.

### Kopja lovas rohamban

```
Feltétel: Lovas roham taktika
Hatás:    SP:+10 (kopja alap Sebzéséhez)
```

Harci- és tornakopja is. A táblák `SP` mezője ezt NEM tartalmazza.

### Láncos: pajzs VÉ felezés

```
Feltétel: cél pajzsot használ
Hatás:    pajzs adta VÉ feleződik
```

A láncos fej megkerüli a pajzsot.

### Pajzs megkerülése

```
Feltétel: cél pajzsot használ
Hatás:    pajzs adta VÉ NEM számít ellene
         (teljes megkerülés)
```

Hajlékony fegyver a pajzs mögé csap.

### Fegyvertörés-immunis

```
Feltétel: passzív fél
Hatás:    Fegyvertörés manőver nem fog rajta
```

Hajlékony (nem merev) fegyver.

### SFÉ dupla ellene

```
Feltétel: cél páncélos
Hatás:    célpont páncél SFÉ: duplán számít
```

Ez a penge páncél ellen különösen rossz.

### Pajzsrongáló (kézi)

```
Feltétel: cél pajzsot használ; Támadó dobás k20: 11-20
Hatás:    cél Pajzs-VÉ: -1 (végleg)
```

Kimondottan pajzs megrongálására alkalmas fegyver.

### Pajzsrongáló (hajító)

```
Feltétel: cél pajzsot használ; Támadó dobás k20: 11-20
Hatás:    Kisebb fegyver
             Cél Pajzs-VÉ: -3 (kihúzásig)
             Státusz: Blokkolt (1)
          Szálfegyver
             Cél Pajzs-VÉ: -5 (kihúzásig)
             Státusz: Blokkolt (2)
```

Pajzsba dobva megakad benne és akadályozza annak használatát.

<br />

---
## Tulajdonság (építési / minőségi opció)

### Pontos

```
Feltétel: 'pengehegy' aktor + egykezes forgatás + aktív fél
Hatás:    aktív fél "Precíz támadás" manőver Ellenpróba: +2
```

Precíziós szúróhegy.

### Lefegyverezhetőbb

```
Feltétel: egykezes forgatás, passzív fél
Hatás:    passzív fél (akié a fegyver)
          Lefegyverzés manőver Ellenpróba: -2
```

Az ilyen fegyvert az ellenfél könnyebben kiüti a kezedből, könnyebben eltöri.

### Lefegyverzése nehezebb

```
Feltétel: passzív fél
Hatás:    passzív fél (akié a fegyver)
          Lefegyverzés manőver Ellenpróba: +2
```

Az ilyen fegyvert nehezebben ütik ki a kezedből.

### Fanyél fegyvertörése könnyebb

```
Feltétel: passzív fél; ellenfél fegyvere fém
Hatás:    passzív fél (akié a fegyver)
          Fegyvertörés manőver Ellenpróba: -2
          (könnyebb eltörni)
```

Fegyvered nyele fából készült, az ellenfél az ilyet könnyebben eltöri.

### Zúzó fegyver ellen rosszabb

```
Feltétel: ellenfél fegyverének sebzésjellege Zúzó
Hatás:    elszenvedett VÉ csökkenésed duplázódik
```

Fegyvered nem túl alkalmas zúzó fegyverek támadásainak hárítására.

### Kampós véggel lábkirántás

```
Feltétel: 'kampós' aktor + aktív fél
Hatás:    aktív fél Lábkirántás manőver Ellenpróba: +2
```

A fegyver kampós vége (pl. glaive-szerű penge).

### Beakad (~50%)

```
Hatás: sebző találat után ~50% esély, hogy beakad és
       harc közben nem húzható ki (KM dönti el)
```

### Önsebzés-kockázat

```
Hatás: támadó k20 egyben esélydobás:
       Küszöb alá dobva magadat sebzed
   Mf nélkül: 1-10
   Mf 1.fok: 1-2
   Mf 2-3.fok: nincs
```

Köz- és önveszélyes fegyver. Részletek: [Ostorharc fegyverek](068_06_ostorharc_fegyverek.md).

---

🔗 [Fegyverek sebzése](068_01_04_fegyverek_sebzese.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
