## Fegyver Extrák

Egyes fegyverek egyedi, szituációs hatásokat hordoznak - ezeket **extráknak** nevezzük. A fegyvertáblák "Extrák" oszlopa hivatkozik rájuk névvel - a hatás mindig szituációs (nem a alapértékeket módosít), és csak akkor lép életbe, ha a feltétele teljesül.

## Felkészítés

### Különleges felkészítés

```
id: kulonleges_felkeszites
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
id: beszorithato_enyhen
Feltétel: Beszorítva harci helyzet
Hatás:    fegyver-járulék (alap+MF+Idea) TÉ/VÉ feleződik
```

Közepesen hosszú fegyver (hossz `5`): beszorítva csak részben forgatható.

### Beszorítható (nagyon)

```
id: beszorithato_nagyon
Feltétel: Beszorítva harci helyzet
Hatás:    fegyver-járulék (alap+MF+Idea) TÉ/VÉ: 0
```

Hosszú fegyver (hossz `7` és felette): beszorítva nem forgatható rendesen. A karakter saját harcérték-része (tulajdonságok, harcmodor, harci fortélyok) változatlan.

### Páncéltalant jobban sebez

```
id: panceltalant_jobban_sebez
Feltétel: cél vérttelen
Hatás:    SP:+3
```

Vérttelen célon nagyobb sebet ejt. Példa: Meneth, Béltépő.

### Pocsék védekező (páncélos ellen)

```
id: pocsek_vedekezo_pancelos_ellen
Feltétel: cél páncélos
Hatás:    VÉ:0
```

Páncélos ellenfél ellen a hárítási hátrány kiütközik.

### Puszta kéz belharcban

```
id: puszta_kez_belharcban
Feltétel: Belharci helyzet
Hatás:    TÉ:0, VÉ:0, SP:0
```

Puszta kéz belharcban: a fegyvertelen büntetés megszűnik. Természetes fegyver fortéllyal az SP 1 marad.

### Belharcban rések közt beszúr

```
id: pancelszuras_belharcban
Feltétel: Belharci helyzet
Hatás:    Belharc fegyverhossz-korlát nem vonatkozik rá
          + földön fekvő ellenfélnél: célpont páncél SFÉ: 0
```

Belharcban a fegyverhossza ellenére is használható, földön lévő ellenfélnél a rések közt szúr.

### Pikás közrefogása

```
id: pikas_kozrefogasa
Feltétel: Közrefogás helyzet + választott támadó (KM/játékos)
Hatás:    TÉ:0, VÉ:0 az egyik (választott) támadó ellen
```

Ha pikával harcolsz és közrefognak, a fegyver az egyik támadó ellen `TÉ/VÉ:0` harcértékű.

### Kopja lovas rohamban

```
id: kopjas_roham
Feltétel: Lovas roham taktika
Hatás:    SP:+10 (kopja alap Sebzéséhez)
```

Harci- és tornakopja is. A táblák `SP` mezője ezt NEM tartalmazza.

### Láncos: pajzs VÉ felezés

```
id: pajzs_ve_felezes
Feltétel: cél pajzsot használ
Hatás:    pajzs adta VÉ feleződik
```

A láncos fej megkerüli a pajzsot.

### Pajzs megkerülése

```
id: pajzs_megkerules
Feltétel: cél pajzsot használ
Hatás:    pajzs adta VÉ NEM számít ellene
         (teljes megkerülés)
```

Hajlékony fegyver a pajzs mögé csap.

### Fegyvertörés-immunis

```
id: fegyvertores_immunis
Feltétel: passzív fél
Hatás:    Fegyvertörés manőver nem fog rajta
```

Hajlékony (nem merev) fegyver.

### SFÉ dupla ellene

```
id: sfe_duplazodik
Feltétel: cél páncélos
Hatás:    célpont páncél SFÉ: duplán számít
```

Ez a penge páncél ellen különösen rossz.

### Pajzsrongáló

```
id: pajzsrongáló
Feltétel: cél pajzsot használ; Támadó dobás k20: 11-20
Hatás:    cél Pajzs-VÉ: -1 (végleg)
```

Kimondottan pajzs megrongálására alkalmas fegyver.

### Pajzsbénító

```
id: pajzsbénító
Feltétel: cél pajzsot használ; Célzó dobás találat: pajzsot
Hatás:    Kisebb hajítófegyver
             Cél Pajzs-VÉ: -3 (kihúzásig)
             Státusz: Blokkolt (1)
          Szálfegyver
             Cél Pajzs-VÉ: -5 (kihúzásig)
             Státusz: Blokkolt (2)
```

Hajítófegyver, pajzsba dobva megakad benne és akadályozza annak használatát.

<br />

---
## Tulajdonság (építési / minőségi opció)

### Pontos

```
id: pontos
Feltétel: 'pengehegy' aktor + egykezes forgatás + aktív fél
Hatás:    aktív fél "Precíz támadás" manőver Ellenpróba: +2
```

Precíziós szúróhegy.

### Lefegyverezhetőbb

```
id: lefegyverezhetobb
Feltétel: egykezes forgatás, passzív fél
Hatás:    passzív fél (akié a fegyver)
          Lefegyverzés manőver Ellenpróba: -2
```

Az ilyen fegyvert az ellenfél könnyebben kiüti a kezedből, könnyebben eltöri.

### Lefegyverzése nehezebb

```
id: lefegyverzese_nehezebb
Feltétel: passzív fél
Hatás:    passzív fél (akié a fegyver)
          Lefegyverzés manőver Ellenpróba: +2
```

Az ilyen fegyvert nehezebben ütik ki a kezedből.

### Fanyél fegyvertörése könnyebb

```
id: fanyel_fegyvertores_konnyebb
Feltétel: passzív fél; ellenfél fegyvere fém
Hatás:    passzív fél (akié a fegyver)
          Fegyvertörés manőver Ellenpróba: -2
          (könnyebb eltörni)
```

Fegyvered nyele fából készült, az ellenfél az ilyet könnyebben eltöri.

### Zúzó fegyver ellen rosszabb

```
id: zuzo_ellen_rosszabb
Feltétel: ellenfél fegyverének sebzésjellege Zúzó
Hatás:    elszenvedett VÉ csökkenésed duplázódik
```

Fegyvered nem túl alkalmas zúzó fegyverek támadásainak hárítására.

### Kampós véggel lábkirántás

```
id: kampos_veggel_labkirantas
Feltétel: 'kampós' aktor + aktív fél
Hatás:    aktív fél Lábkirántás manőver Ellenpróba: +2
```

A fegyver kampós vége (pl. glaive-szerű penge).

### Beakad (~50%)

```
id: beakadas_kockazat
Hatás: sebző találat után ~50% esély, hogy beakad és
       harc közben nem húzható ki (KM dönti el)
```

### Önsebzés-kockázat

```
id: onsebzes_kockazat
Hatás: támadó k20 egyben esélydobás:
       Küszöb alá dobva magadat sebzed
   Mf nélkül: 1-10
   Mf 1.fok: 1-2
   Mf 2-3.fok: nincs
```

Köz- és önveszélyes fegyver. Részletek: [Ostorharc fegyverek](068_06_ostorharc_fegyverek.md).

<br />

---
## Távharc extrák

Ezek a hatások a [hajító-](068_07_hajitofegyverek.md) és [lőfegyverekhez](068_08_lofegyverek.md) kötöttek. A legtöbb KM által könyvelt (szituációs) hatás.

### SFÉ duplán számít ellene

```
id: tavharc_sfe_duplan
Feltétel: -
Hatás:    célpont páncél SFÉ: duplán számít
```

A lövedék páncél ellen különösen hatékony. Példa: Dobócsillag, Parittya.

### Erőbónusz csak tervezett Erőnél

```
id: tavharc_ij_erobonusz_tervezett
Feltétel: az íj a lövő Erő értékére tervezve
Hatás:    íj Erőbónusza csak ekkor számít (KM)
```

Az íj Erőbónusza csak akkor jár, ha az íjat kifejezetten erre az Erő értékre készítették.

### Közeli lövés automatikus bónusza

```
id: tavharc_hajitotor_kozeli_loves
Feltétel: célpont az 1. Cellában
Hatás:    automatikus Közeli lövés fortély CÉ:+10
```

Közeli célra a fegyver automatikusan megkapja a Közeli lövés fortély bónuszát. Példa: Hajítótőr.

### Csak a készítő kezében

```
id: tavharc_elf_ij_keszito
Feltétel: a fegyvert a készítő-birtokos használja
Hatás:    az értékek csak ekkor érvényesek;
          másnak hagyományos íj (Osztó 4, nincs Erőbónusz)
```

Az egyedi (elf) íj teljes értéke csak a készítőjének jár. Példa: Elf íj.

### Tár + újratöltés (Kharei)

```
id: tavharc_ujratoltes_kharei
Hatás: míg a tár ki nem fogy, sebesség-büntetés
       nélkül lő; utána újratöltés 1 kör (KM)
```

Tölténytáras nyílpuska. Példa: Kharei nyílpuska.

### Újratöltés (Shad0ni)

```
id: tavharc_ujratoltes_shad0ni
Hatás: újratöltés 1 emberrel 3 kör,
       2 emberrel 1 kör (KM)
```

Nehéz, lassan tölthető páncéltörő. Példa: Shad0ni páncéltörő.

### Aquir kézben azonnali halál

```
id: tavharc_aquir_azonnali_halal
Feltétel: aquir használja
Hatás:    találatkor azonnali halál;
          az Átütés is csak aquir kézben érvényes (KM)
```

A fegyver teljes ereje csak aquir kézben bontakozik ki. Példa: Aquir nyílpuska.

### Fúvócső (kicsi) esélydobás

```
id: tavharc_fuvocso_kicsi_kabitas
Hatás: k20 Sebzésdobás: 20 → 1 ÉP, egyébként 0 ÉP
       (a méreg/altató a lényeg, KM)
```

A kis fúvócső maga alig sebez - a rajta bevitt méreg vagy altató a lényeg.

<br />

---

🔗 [Fegyverek sebzése](068_01_04_fegyverek_sebzese.md) →

⚜️ [Nyitóoldal](szabalyrendszer.md#6-harcrendszer-️)
