import type {
  DemoActivity,
  DemoPackage,
  DemoQuestion,
  EditorialStatus,
  QuestionType,
} from "./types"

const dayNames = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
]
const categories = [
  "Društvo",
  "Život",
  "Posao",
  "Kultura",
  "Porodica",
  "Navike",
  "Sport",
]
const questionSets = [
  [
    "Da li je komšijska solidarnost danas slabija nego pre deset godina?",
    "Šta vam najviše nedostaje kada radite od kuće?",
    "Da li biste prihvatili manju platu za kraće radno vreme?",
    "Koji prizor najbolje opisuje jutro u vašem kraju?",
    "Koji od ovih stolova deluje kao tipičan nedeljni ručak?",
  ],
  [
    "Da li bi domaći zadaci trebalo da budu kraći?",
    "Koliko često odlažete obaveze do poslednjeg trenutka?",
    "Da li je važnije imati siguran posao ili zanimljiv posao?",
    "Kako zamišljate savremeni porodični dom u Srbiji?",
    "Koji red u pošti biste prvo izabrali?",
  ],
  [
    "Da li se kod nas dovoljno poštuje tuđe vreme?",
    "Biste li radije živeli u manjem gradu ili velikom centru?",
    "Da li treba ograničiti poslovne poruke posle radnog vremena?",
    "Koja ilustracija najbolje prikazuje generacijski jaz?",
    "Koja korpa predstavlja razumnu nedeljnu kupovinu?",
  ],
  [
    "Da li kultura može da promeni način na koji razgovaramo?",
    "Koliko vam je važno da poznajete svoje komšije?",
    "Da li biste podržali više zelenih površina umesto parkinga?",
    "Koji detalj najviše podseća na detinjstvo?",
    "Na kojoj fotografiji javni prostor deluje najprijatnije?",
  ],
  [
    "Da li se uspeh u Srbiji previše meri novcem?",
    "Biste li proveli vikend bez mobilnog telefona?",
    "Da li bi finansijska pismenost trebalo da bude školski predmet?",
    "Kako izgleda idealna pauza na poslu?",
    "Koja scena najbolje prikazuje balans posla i života?",
  ],
  [
    "Da li su porodična okupljanja ređa nego ranije?",
    "Ko prvi treba da plati kafu na prvom susretu?",
    "Da li biste promenili grad zbog boljeg kvaliteta života?",
    "Koji predmet najbolje simbolizuje gostoprimstvo?",
    "Koji balkon biste izabrali za jutarnju kafu?",
  ],
  [
    "Da li nedelja treba da ostane dan za odmor?",
    "Koliko često ručate zajedno sa porodicom?",
    "Da li su male svakodnevne navike važnije od velikih odluka?",
    "Koja ilustracija najbolje opisuje miran dan?",
    "Koji park deluje najpristupačnije svim generacijama?",
  ],
]

const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "2-digit",
  month: "short",
})

const monday = new Date()
const mondayOffset = (monday.getDay() + 6) % 7
monday.setDate(monday.getDate() - mondayOffset)

const statuses: EditorialStatus[] = [
  "Čeka proveru",
  "Čeka proveru",
  "Odobreno",
  "Predlog AI",
  "Predlog AI",
  "Odobreno",
  "Zakazano",
  "Čeka proveru",
]

function questionType(index: number): QuestionType {
  if (index === 3) return "Ilustrovano"
  if (index === 4) return "Vizuelno"
  return "Tekstualno"
}

export const demoPackages: DemoPackage[] = dayNames.map((day, dayIndex) => {
  const date = new Date(monday)
  date.setDate(monday.getDate() + dayIndex)
  const publishDate = date.toISOString().slice(0, 10)
  const questions: DemoQuestion[] = questionSets[dayIndex].map(
    (text, index) => ({
      id: `demo-${dayIndex + 1}-${index + 1}`,
      dayIndex,
      text,
      answers:
        index === 1
          ? ["Često", "Ponekad", "Nikada"]
          : index === 4
            ? ["Prva", "Druga", "Treća", "Nijedna"]
            : ["Da", "Ne", "Nisam siguran/na"],
      category: categories[(dayIndex + index) % categories.length],
      type: questionType(index),
      publishDate,
      rationale:
        "Demonstraciono obrazloženje uredničke relevantnosti i potencijala za diskusiju.",
      status: statuses[(dayIndex * 2 + index) % statuses.length],
    }),
  )

  return {
    id: `package-${dayIndex + 1}`,
    dayIndex,
    day,
    date: dateFormatter.format(date),
    publishTime: "08:00",
    questions,
  }
})

export const demoActivities: DemoActivity[] = [
  {
    id: "a1",
    time: "Danas, 10:24",
    actor: "Urednik",
    action: "izmenio odgovore",
    target: "Nedeljni ručak",
  },
  {
    id: "a2",
    time: "Danas, 09:48",
    actor: "AI predlog",
    action: "pripremio dnevni paket",
    target: "Četvrtak",
  },
  {
    id: "a3",
    time: "Juče, 18:12",
    actor: "Urednik",
    action: "odobrio pitanje",
    target: "Finansijska pismenost",
  },
  {
    id: "a4",
    time: "Juče, 16:03",
    actor: "Urednik",
    action: "odbio pitanje",
    target: "Saobraćajne navike",
  },
  {
    id: "a5",
    time: "Ponedeljak, 11:30",
    actor: "AI predlog",
    action: "predložio bolju formulaciju",
    target: "Komšijska solidarnost",
  },
]

export const allDemoQuestions = demoPackages.flatMap((pack) => pack.questions)
