import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type SerbianScript = "cyrillic" | "latin"

const scriptStorageKey = "sta-kaze-srbija:script"
const SerbianScriptContext = createContext<{
  script: SerbianScript
  toggleScript: () => void
} | null>(null)

type TextSnapshot = { source: string; rendered: string }
const textSnapshots = new WeakMap<Text, TextSnapshot>()
const attributeSnapshots = new WeakMap<Element, Map<string, TextSnapshot>>()

const latinDigraphs: Record<string, string> = {
  DŽ: "Џ",
  Dž: "Џ",
  dž: "џ",
  LJ: "Љ",
  Lj: "Љ",
  lj: "љ",
  NJ: "Њ",
  Nj: "Њ",
  nj: "њ",
}

const latinLetters: Record<string, string> = {
  A: "А", B: "Б", C: "Ц", Č: "Ч", Ć: "Ћ", D: "Д", Đ: "Ђ", E: "Е",
  F: "Ф", G: "Г", H: "Х", I: "И", J: "Ј", K: "К", L: "Л", M: "М",
  N: "Н", O: "О", P: "П", R: "Р", S: "С", Š: "Ш", T: "Т", U: "У",
  V: "В", Z: "З", Ž: "Ж", a: "а", b: "б", c: "ц", č: "ч", ć: "ћ",
  d: "д", đ: "ђ", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "ј",
  k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р", s: "с",
  š: "ш", t: "т", u: "у", v: "в", z: "з", ž: "ж",
}

const cyrillicLetters: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Ђ: "Đ", Е: "E", Ж: "Ž",
  З: "Z", И: "I", Ј: "J", К: "K", Л: "L", М: "M", Н: "N", О: "O",
  П: "P", Р: "R", С: "S", Т: "T", Ћ: "Ć", У: "U", Ф: "F", Х: "H",
  Ц: "C", Ч: "Č", Ш: "Š", а: "a", б: "b", в: "v", г: "g", д: "d",
  ђ: "đ", е: "e", ж: "ž", з: "z", и: "i", ј: "j", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "ć",
  у: "u", ф: "f", х: "h", ц: "c", ч: "č", ш: "š",
}

function toCyrillic(value: string): string {
  return value
    .replace(/DŽ|Dž|dž|LJ|Lj|lj|NJ|Nj|nj/g, (digraph) => latinDigraphs[digraph])
    .replace(/[A-Za-zČĆĐŠŽčćđšž]/g, (letter) => latinLetters[letter] ?? letter)
}

function toLatin(value: string): string {
  return value
    .replace(/[ЏџЉљЊњ]/g, (letter, index, source: string) => {
      const next = source[index + 1]
      const nextIsUppercase =
        !!next && next !== next.toLowerCase() && next === next.toUpperCase()
      const uppercasePair = nextIsUppercase
      const leadingUppercase = letter === letter.toUpperCase()
      const pair = letter === "Џ" || letter === "џ"
        ? ["dž", "Dž", "DŽ"]
        : letter === "Љ" || letter === "љ"
          ? ["lj", "Lj", "LJ"]
          : ["nj", "Nj", "NJ"]
      return uppercasePair ? pair[2] : leadingUppercase ? pair[1] : pair[0]
    })
    .replace(/[А-Яа-яЂђЋћЏџЉљЊњ]/g, (letter) => {
      const mapped = cyrillicLetters[letter]
      return mapped ?? letter
    })
}

function translate(value: string, script: SerbianScript): string {
  return script === "cyrillic" ? toCyrillic(value) : toLatin(value)
}

function updateTextNode(node: Text, script: SerbianScript) {
  const current = node.data
  const previous = textSnapshots.get(node)
  const source = previous?.rendered === current ? previous.source : current
  const rendered = translate(source, script)
  textSnapshots.set(node, { source, rendered })
  if (rendered !== current) node.data = rendered
}

const translatableAttributes = ["alt", "aria-label", "placeholder", "title"]

function updateAttributes(element: Element, script: SerbianScript) {
  let snapshots = attributeSnapshots.get(element)
  if (!snapshots) {
    snapshots = new Map()
    attributeSnapshots.set(element, snapshots)
  }

  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute)
    if (current === null) continue
    const previous = snapshots.get(attribute)
    const source = previous?.rendered === current ? previous.source : current
    const rendered = translate(source, script)
    snapshots.set(attribute, { source, rendered })
    if (rendered !== current) element.setAttribute(attribute, rendered)
  }
}

function visitNode(node: Node, script: SerbianScript) {
  if (node.nodeType === Node.TEXT_NODE) {
    updateTextNode(node as Text, script)
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    updateAttributes(node as Element, script)
  }
  for (const child of Array.from(node.childNodes)) visitNode(child, script)
}

export function getSerbianScriptPreference(): SerbianScript {
  try {
    return window.localStorage.getItem(scriptStorageKey) === "latin" ? "latin" : "cyrillic"
  } catch {
    return "cyrillic"
  }
}

export function SerbianScriptProvider({ children }: { children: ReactNode }) {
  const [script, setScript] = useState<SerbianScript>(getSerbianScriptPreference)

  useEffect(() => {
    try {
      window.localStorage.setItem(scriptStorageKey, script)
    } catch {
      // The portal still works when browser storage is unavailable.
    }

    document.documentElement.lang = script === "cyrillic" ? "sr-Cyrl" : "sr-Latn"
    const root = document.getElementById("root")
    if (!root) return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) visitNode(node, script)
        } else if (mutation.type === "characterData" && mutation.target instanceof Text) {
          updateTextNode(mutation.target, script)
        } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
          updateAttributes(mutation.target, script)
        }
      }
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: translatableAttributes,
      characterData: true,
      childList: true,
      subtree: true,
    })
    visitNode(root, script)

    return () => observer.disconnect()
  }, [script])

  const toggleScript = () => {
    setScript((current) => current === "cyrillic" ? "latin" : "cyrillic")
  }

  return (
    <SerbianScriptContext.Provider value={{ script, toggleScript }}>
      {children}
    </SerbianScriptContext.Provider>
  )
}

export function useSerbianScript() {
  const context = useContext(SerbianScriptContext)
  if (!context) throw new Error("ScriptToggle must be used inside SerbianScriptProvider.")
  return context
}

export function ScriptToggle() {
  const { script, toggleScript } = useSerbianScript()
  return (
    <button
      type="button"
      className="script-toggle"
      aria-label={script === "cyrillic" ? "Prebaci na latinicu" : "Prebaci na ćirilicu"}
      title={script === "cyrillic" ? "Prebaci na latinicu" : "Prebaci na ćirilicu"}
      onClick={toggleScript}
    >
      {script === "cyrillic" ? "Latinica" : "Ћирилица"}
    </button>
  )
}
