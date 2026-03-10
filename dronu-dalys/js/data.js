const droneData = [
  {
    id: 'intro',
    title: 'Įžanga: Bepiločio Orlaivio Pagrindinės Dalys',
    description: `
      <p>Dronai, dar vadinami bepiločiais orlaiviais, pastaraisiais metais tapo neatsiejama daugelio sričių dalimi – nuo pramogų ir fotografijos iki pramonės, žemės ūkio bei gelbėjimo operacijų. Jų universalumas ir gebėjimas pasiekti sunkiai prieinamas vietas padarė juos itin vertingais įrankiais tiek profesionalams, tiek mėgėjams.</p>
      <p>Vienas iš labiausiai pastebimų pokyčių, kuriuos dronai atnešė, yra oro fotografijos ir filmavimo srityje. Šiuolaikiniai dronai leidžia užfiksuoti nuostabius kadrus iš oro, kas anksčiau buvo prieinama tik naudojant brangias sraigtasparnių ar lėktuvų paslaugas.</p>
      <p>Šiame gide interaktyviai apžvelgsime pagrindines drono sudedamąsias dalis: korpusą, variklius, propelerius, akumuliatorių, skrydžio valdiklį ir kitus esminius komponentus. Pasirinkite dalį iš meniu, kad sužinotumėte daugiau!</p>
    `,
    image: 'img/intro.webp'
  },
  {
    id: 'frame',
    title: 'Korpusai (Karkasai)',
    description: `
      <p>Įsivaizduokite droną kaip gyvą organizmą - jo rėmas ar korpusas būtų tarsi skeletas ir oda viename. Ši struktūra ne tik laiko visus drono komponentus kartu, bet ir apsaugo juos nuo aplinkos poveikio, suteikia stabilumo skrydžio metu ir net prisideda prie drono aerodinaminių savybių.</p>
      <h3>Korpusų Medžiagos</h3>
      <ul>
        <li><strong>Anglies pluoštas (Carbon Fiber):</strong> Naudojamas aukštos klasės komerciniuose ir profesionaliuose dronuose, lengvas ir labai tvirtas.</li>
        <li><strong>Aliuminis:</strong> Pramoniniai ir kai kurie komerciniai dronai.</li>
        <li><strong>Plastikas (ABS, Polikarbonatas):</strong> Mėgėjiški ir vidutinės klasės dronai (pvz., DJI Mavic serija).</li>
        <li><strong>Magnis:</strong> Lengvi, bet tvirti korpusai (pvz., DJI Mini serija).</li>
      </ul>
      <h3>Tipai</h3>
      <p>Nuo fiksuoto sparno lėktuvėlių iki populiariausių multikopterių (kvadrokopteriai, heksakopteriai, oktokopteriai) ir specialios paskirties (vandeniui atsparių, FPV lenktyninių) korpusų. Svarbu optimizuoti aerodinamiką ir apsaugoti elektroniką.</p>
    `,
    image: 'img/korpusas.webp'
  },
  {
    id: 'motors',
    title: 'Varikliai',
    description: `
      <p>Jei dronų rėmai ir korpusai yra jų kūnas, tai varikliai neabejotinai yra jų širdis ir raumenys. Dažniausiai naudojami bešepetėliniai (brushless) varikliai, kurie pasižymi didesniu efektyvumu, ilgesniu tarnavimo laiku ir mažesniu svoriu nei senesni šepetėliniai varikliai.</p>
      <p>Bešepetėliniai varikliai sukelia mažiau elektromagnetinių trukdžių, o tai ypač svarbu dronų navigacijos sistemoms. Galingi varikliai reikalingi sunkiems dronams ar atlaikyti sudėtingas oro sąlygas. Filmavimo dronuose svarbus tylus veikimas, o FPV dronuose – dideli apsisukimai greitoms reakcijoms ir manevrams.</p>
      <p>Variklių valdymas vykdomas ESC (Electronic Speed Controller) sistemomis, kurios greitai keičia apsukų greičius ir taip subalansuoja bei valdo drono skrydį ore.</p>
    `,
    image: 'img/varikliai.webp'
  },
  {
    id: 'esc',
    title: 'ESC (Electronic Speed Controller)',
    description: `
      <p>ESC (elektroninis greičio reguliatorius) yra nepaprastai svarbus drono komponentas, kuris valdo variklių greitį, remdamasis signalais, siunčiamais iš skrydžio valdiklio (flight controller).</p>
      <h3>ESC Funkcijos:</h3>
      <ul>
        <li><strong>Variklių greičio valdymas:</strong> Greitas mikrosekundžių tikslumu reakcijos laikas stabilizuoja droną, reaguojant į vėjo gūsius ar piloto komandas.</li>
        <li><strong>Elektros srovės konvertavimas:</strong> Konvertuoja nuolatinę srovę (DC) iš baterijos į kintamą srovę (AC) bešepetėliniams varikliams.</li>
        <li><strong>Saugumo funkcijos:</strong> Apsaugo nuo perkaitimo ar per didelės įtampos/srovės šuolių.</li>
      </ul>
      <p>Šiuolaikiniuose vartotojiškuose dronuose (pvz. DJI) ESC yra pilnai integruoti ir individualiai suderinti gamykloje, kai tuo tarpu FPV surenkamuose dronuose ESC parametrai gali būti labai specifiniai lenktynėms ir staigiems manevrams.</p>
    `,
    image: 'img/esc.webp'
  },
  {
    id: 'pdb',
    title: 'PDB (Power Distribution Board)',
    description: `
      <p>PDB (maitinimo paskirstymo plokštė) yra komponentas, kuris paskirsto elektros energiją iš akumuliatoriaus į įvairius drono elementus (variklius, skrydžio valdiklį, ESC, sensorius, video siųstuvus).</p>
      <h3>PDB ypatybės:</h3>
      <ul>
        <li><strong>Energijos paskirstymas:</strong> Aukštos įtampos kanalai eina į ESC/variklius, o mažesnės, filtruotos įtampos – į elektroniką.</li>
        <li><strong>Įtampos konversija (BEC):</strong> Sumažina baterijos įtampą (pvz., iš 4S/14.8V į stabilią 5V ar 9V liniją), kurios reikia valdikliui ar kamerai.</li>
        <li><strong>Energijos matavimas:</strong> Gali turėti srovės/įtampos daviklius, kad pilotas ekrane matytų likusią baterijos talpą realiu laiku.</li>
      </ul>
      <p>Vis dažniau naudojami AIO (All-In-One) sprendimai, kur PDB esminės grandinės sujungiamos tiesiai kartu su Skrydžio valdikliu ar net keturiais ESC į vieną bendrą plokštę.</p>
    `,
    image: 'img/pdb.webp'
  },
  {
    id: 'propellers',
    title: 'Propeleriai',
    description: `
      <p>Propeleriai generuoja trauką, leidžiančią dronui pakilti ir manevruoti. Tinkamai parinkti propeleriai prisideda prie energijos efektyvumo ir skrydžio stabilumo.</p>
      <h3>Medžiagos ir Savybės</h3>
      <ul>
        <li><strong>Plastikas:</strong> Lengvas, pigus, atsparus nedideliems smūgiams, puikus pasirinkimas pradedantiesiems ir bendram naudojimui.</li>
        <li><strong>Anglies pluoštas:</strong> Stipresni ir lengvesni, suteikia greitesnę reakciją, tinka profesionalams (nors ir trapesni smūgio metu).</li>
      </ul>
      <p>Svarbiausi propelerių parametrai yra <strong>ilgis</strong> ir <strong>pikis (pitch)</strong>. Ilgesni propeleriai generuoja daugiau traukos, o didesnis pikis leidžia pasiekti didesnį maksimalų greitį (bet reikalauja daugiau energijos iš variklio). Tinkamas balansavimas yra būtinas, norint išvengti vibracijų, "Jello" efekto kameroje ir nereikalingo variklių dėvėjimosi.</p>
    `,
    image: 'img/propeleriai.webp'
  },
  {
    id: 'battery',
    title: 'Akumuliatoriai (Baterijos)',
    description: `
      <p>Akumuliatorius yra energijos šaltinis visai dronų sistemai. Dronuose dažniausiai naudojami <strong>ličio polimerų (LiPo)</strong> akumuliatoriai, nes jie pasižymi dideliu energijos tankiu (lengvi, bet talpūs) ir gebėjimu atiduoti labai dideles sroves per trumpą laiką (aukštas "C-Reitingas").</p>
      <h3>Pagrindiniai Parametrai:</h3>
      <ul>
        <li><strong>Įtampa (V):</strong> Apibrėžiama celių atžvilgiu (S). Pvz., 3S = ~11.1V, 4S = ~14.8V. Kuo aukštesnė įtampa, tuo greičiau gali suktis varikliai.</li>
        <li><strong>Talpa (mAh):</strong> Nurodo, kiek energijos akumuliatorius saugo. Didesnė talpa - ilgesnis skrydis, tačiau ir didesnis sistemos svoris, kurį varikliams reikia pakelti.</li>
        <li><strong>Iškrovos srovė (C-Rating):</strong> Parodo, kaip greitai baterija gali saugiai atiduoti energiją be perkaitimo.</li>
      </ul>
      <p>Saugi priežiūra yra esminė: negalima per daug iškrauti LiPo baterijų, rekomenduojama jas laikyti ne pilnai pakrautas („Storage“ režimu) ilgalaikiam saugojimui ir griežtai nenaudoti fizinių pažeidimų ar "išsipūtimų" turinčių baterijų.</p>
    `,
    image: 'img/akumuliatoriai.webp'
  },
  {
    id: 'sensors',
    title: 'Sensoriai',
    description: `
      <p>Sesoriai prilyginami drono „pojūčiams“. Jie teikia esminę informaciją skrydžio valdikliui, leisdami skraidyti stabiliai, atpažindami aukštį, vietą erdvėje, kliūtis ir orientaciją.</p>
      <ul>
        <li><strong>GPS:</strong> Užtikrina drono koordinates ir aukštį, leidžia tokias funkcijas, kaip grįžimas namo (RTH) ir tikslus kabėjimas vietoje.</li>
        <li><strong>IMU (Inertial Measurement Unit):</strong> Svarbiausias jutiklių blokas. Savyje slepia giroskopus ir akcelerometrus. Nuolat atpažįsta menkiausią drono pasvirimą.</li>
        <li><strong>Kompasas (Magnetometras):</strong> Padeda nustatyti, į kurią pasaulio kryptį atsisukęs dronas. Lemiama funkcija tiksliai navigacijai.</li>
        <li><strong>Barometras:</strong> Tiksliai matuoja oro slėgį ir taip nusako pakilimo aukštį.</li>
        <li><strong>Kliūčių vengimas (Optiniai, Ultragarsiniai, LiDAR):</strong> Leidžia sekti žemės reljefą skrendant žemai ir vengti medžių, pastatų.</li>
      </ul>
    `,
    image: 'img/sensoriai.webp'
  },
  {
    id: 'camera',
    title: 'Kameros ir Filmavimo Įranga',
    description: `
      <p>Daugeliui dronas tapo skraidančiu fotoaparatu. Kameros gali būti kietai integruotos su dronu (kaip DJI Mavic serijoje) arba kabinamos kaip išorinės „action“ kameros (pvz., FPV dronuose).</p>
      <p>Svarbiausia kokybei funkcija išlieka <strong>Gimbalas (Stabilizatorius)</strong>. Tai dažniausiai 3 ašių bešepetėlių motorų prietaisas, kuris idealiai išlaiko kamerą horizontalią nepriklausomai nuo to, kaip vartosi dronas ore, kompensuodamas visas vibracijas.</p>
      <p>Pramonėje naudojamos ne tik vaizdo kameros, bet ir Multispektrinės kameros (žemės ūkiui) bei Termovizoriai (infraraudonųjų spindulių), tinkantys namų šiluminių nuostolių ar gelbėjimo operacijų analizei.</p>
    `,
    image: 'img/kameros.webp'
  },
  {
    id: 'fc',
    title: 'Skrydžio Valdiklis (FC)',
    description: `
      <p>Skrydžio valdiklis yra drono <strong>„smegenys“</strong>. Tai – centrinis procesorius, kuris per tūkstantosias sekundės dalis super greitai apdoroja gautus duomenis iš imtuvo (kuriuos siunčia pilotas) bei iš IMU jutiklių ir GPS / Barometro.</p>
      <p>Apdorojęs duomenis, valdiklis apskaičiuoja, kokiu tiksliai greičiu ir kurią akimirką turėtų suktis kiekvienas atskiras variklis, siųsdamas signalą į ESC. Jei pilotas paleidžia svirtis, FC pagal akcelerometrus automatiškai bando palaikyti droną lygioje padėtyje horizonto atžvilgiu.</p>
      <p>Išmanieji skrydžio valdikliai taip pat atlieka „išmanias“ automatines misijas: skrydį pagal iš anksto nupieštus taškus (Waypoints) bei autonominį grįžimą namo (Return to Home), praradus valdymo ryšį.</p>
    `,
    image: 'img/valdiklis.webp'
  },
  {
    id: 'antenna',
    title: 'Antenos ir Ryšys',
    description: `
      <p>Antenos užtikrina ryšį tarp valdymo pulto (Radijo bangų siųstuvo) ir paties drono (Imtuvo). Tai kritiškai svarbu saugumui ir valdymui.</p>
      <p>Dronuose naudojami du pagrindiniai protokolų signalai:</p>
      <ul>
        <li><strong>Valdymo signalas:</strong> Perduoda piloto veiksmus. Dažnai veikia patikimais 2.4 GHz arba specialiais ilgametražiais žemutinių dažnių kanalais (pvz. 868 / 915 MHz ELRS ar Crossfire).</li>
        <li><strong>Vaizdo srautas (Video Transmission):</strong> Šiomis dienomis (ypač su FPV apsauginiais akiniais) 5.8 GHz dažnis leidžia atvaizduoti tiesioginę transliaciją iš oro greitu ir trumpu atsilikimu (Low latency). Skaitmeninės vaizdo sistemos vis labiau keičia analogines, nors jos yra brangesnės ir šiek tiek masyvesnės.</li>
      </ul>
      <p>Naudojamos „Antenos poliarizacijos“ – apskritiminės poliarizacijos atsparesnės radio atspindžiams (pastatų aplinkoje).</p>
    `,
    image: 'img/antena.webp'
  },
  {
    id: 'remote',
    title: 'Nuotolinio Valdymo Pultas',
    description: `
      <p>Pultas (transliatorius) yra pagrindinis piloto įrankis. Jo kokybė ir ergonomiškumas lemia tikslų skrydį. Jis konvertuoja piloto priskirtas fizines komandas (pirštų judesius per joystick'us (gimbalus)) į elektroninius skaitmeninius signalus, koduojamus radijo bangomis.</p>
      <p>Tradiciniai valdymo pultai turi kelias svirtis (jungiklius) skrydžio režimų keitimui (pvz., stabilizacijos ar manualinio režimo). Naujos kartos (DJI/Autel) pultai integruoja lietimui jautrius planšetinius ar LCD ekranus su tiesioginiu 1080p vaizdu, telemetrija (akumuliatoriaus informacija, aukščio duomenys, palydovų skaičius) ir galimybe visą tai interaktyviai keisti mygtukais ar specialiais meniu be atskiro telefono prijungimo.</p>
    `,
    image: 'img/pultas.webp'
  }
];
