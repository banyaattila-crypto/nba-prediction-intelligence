import React from 'react'
import { Dialog, Legend, Mark } from './ui'

function Block({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-2xl font-extrabold uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  )
}

const Formula = ({ children }) => <pre className="tnum overflow-x-auto rounded border bg-paper p-3 font-mono text-xs leading-relaxed">{children}</pre>

const LIMITS = [
  'Egyetlen könyv árai alapján számol: az ESPN által közölt aktuális DraftKings-vonalak és szorzók. Ha egy ár vagy vonal hiányzik (például „OFF"), az adott piac nem kerül értékelésre.',
  'A pihenőnap és a hátizsák-meccs (back-to-back) hatása jelenleg nincs számolva, a rendszer mindig alapértéket használ.',
  'A sérülések hatása fix sztárlistából és általános alapértékből jön, nem aktuális játékosadatból.',
  'Az ORtg, DRtg és tempó a pontátlagokból becsült érték.',
  'A modell nem ad hozzá információt a piachoz (170 meccses visszamérés, 2026-10-20 – 11-12, kalibrációs súly: 0), ezért a jelzések a piaci valószínűséghez igazodnak. Kis minta: a CI széles, kis pozitív súly nem zárható ki.',
  'A történelmi sérülések és pihenőnapok nem álltak rendelkezésre, ezért a sérülés- és pihenőhatás nem mérhető vissza.',
  'A záró vonal (CLV) rögzítése nincs megvalósítva.',
]

export default function MethodologyModal({ onClose }) {
  return (
    <Dialog title="Módszertan és korlátok" onClose={onClose}>
      <div className="space-y-8 p-5 pt-14 sm:p-8 sm:pt-12">
        <header>
          <p className="eyebrow mb-1">Hogyan számol az oldal</p>
          <h2 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide">Módszertan</h2>
          <p className="mt-3 text-sm text-mute">Az oldal a modell és a piac különbségét mutatja. Azt nem mondja meg, hogy a modellnek igaza van. Ezt csak a Napló fül lezárt tippjei mérik.</p>
        </header>

        <Block title="Jelölések">
          <Legend />
          <p className="text-sm text-mute">Kék: a modell becslése. Narancs: a piaci ár. Fekete: forrásadat. Szürke, szaggatott: becsült alapérték.</p>
        </Block>

        <Block title="1. A piaci ár vig-mentesítése">
          <p className="text-sm text-mute">A szorzókból számolt valószínűségek összege 100% fölött van, a többlet a bukméker árrése. Kétkimenetes piacon arányosan osztjuk szét:</p>
          <Formula>{'P_piac(A) = (1 / szorzó_A) / (1 / szorzó_A + 1 / szorzó_B)'}</Formula>
        </Block>

        <Block title="2. Eltérés és várható hozam">
          <Formula>{'eltérés (pp) = (P_modell − P_piac) · 100\nvárható hozam (%) = [P_modell · (szorzó − 1) − (1 − P_modell)] · 100'}</Formula>
          <p className="text-sm text-mute">
            „Eltérés” jelzést akkor kap egy piac, ha az eltérés legalább 2 pp és a várható hozam legalább 2,5%. Ez csak azt jelenti, hogy a modell máshogy látja a piacot, nem azt, hogy igaza van.
          </p>
        </Block>

        <Block title="3. Szimuláció">
          <p className="text-sm text-mute">
            <Mark kind="model" /> Meccsenként 10 000 szimuláció normális pontszóródással és közös tempóingadozással, a szezon valós eredményeiből mért szórásokkal (különbség 14,4, összpont 17,7). A várható pontszámot a csapatok becsült támadó- és védőhatékonysága, a hazai pálya és a sérülések adják.
          </p>
        </Block>

        <Block title="4. Kalibráció és horgonyzás">
          <p className="text-sm text-mute">
            A szezon 170 lejátszott meccsén (záró vonalakkal) megmértük a piac hibáját és a modell pontosságát pontbeli csapatértékeléssel (92 meccs). A modell pontatlanabb volt a piacnál (RMSE 15,4–16,2 szemben 14,3-mal), a piachoz keverés optimális súlya nulla körüli (95% CI −0,3 … +0,4), a nyers modell jelzett tippjeinek hozama pedig nem különbözött a vigtől (−8,9% szemben −7,8%-kal). Ezért a valószínűség a piaci és a nyers modell súlyozott keveréke, a modell súlya most 0:
          </p>
          <Formula>{'P_kalibrált = P_piac + súly · (P_modell − P_piac)      súly = 0'}</Formula>
          <p className="text-sm text-mute">
            A nyers modell a kártyákon látszik, de nem ez dönti el a jelzést. 8 pp-nél nagyobb eltérés sosem jelzés: a visszamérésben a nyers modell eltérésének mediánja 13,7 pp volt, ami modellzajra utalt. A súlyt csak újramérés emelheti (a <code className="font-mono">backend/calibration</code> mappa szkriptjei).
          </p>
        </Block>

        <Block title="5. Tétjavaslat">
          <p className="text-sm text-mute">Negyed Kelly, legfeljebb 2,5 egység. Egy egység a bankroll 1%-a. A javaslat annyira megbízható, mint a modell valószínűsége.</p>
        </Block>

        <Block title="Ismert korlátok">
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {LIMITS.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Block>

        <aside className="panel border-ink p-4 text-sm">
          <p className="font-semibold">Felelős játék</p>
          <p className="mt-1 text-mute">A sportfogadás pénzügyi kockázattal jár, a modell egyetlen meccsen sem garantál nyereséget. Az alkalmazás kutatási és döntéstámogató eszköz: nem köt fogadást, és nem kezel pénzt.</p>
        </aside>
      </div>
    </Dialog>
  )
}
