const questionVisualAssetFiles: Record<string, string> = {
  "week-2026-11-16-pon-04": "week-2026-11-16-pon-04.jpg",
  "week-2026-11-16-pon-05": "week-2026-11-16-pon-05.jpg",
  "week-2026-11-17-uto-04": "week-2026-11-17-uto-04.jpg",
  "week-2026-11-17-uto-05": "week-2026-11-17-uto-05.jpg",
  "week-2026-11-18-sre-04": "week-2026-11-18-sre-04.jpg",
  "week-2026-11-18-sre-05": "week-2026-11-18-sre-05.jpg",
  "week-2026-11-19-cet-04": "week-2026-11-19-cet-04.jpg",
  "week-2026-11-19-cet-05": "week-2026-11-19-cet-05.jpg",
  "week-2026-11-23-pon-05": "week-2026-11-23-pon-05.png",
  "week-2026-11-23-uto-04": "week-2026-11-23-uto-04.png",
  "week-2026-11-23-uto-05": "week-2026-11-23-uto-05.png",
  "week-2026-11-23-sre-04": "week-2026-11-23-sre-04.png",
  "week-2026-11-23-sre-05": "week-2026-11-23-sre-05.png",
  "week-2026-11-23-cet-04": "week-2026-11-23-cet-04.png",
  "week-2026-11-23-cet-05": "week-2026-11-23-cet-05.png",
  "week-2026-11-23-pet-04": "week-2026-11-23-pet-04.png",
  "week-2026-11-23-pet-05": "week-2026-11-23-pet-05.png",
  "week-2026-11-23-sub-04": "week-2026-11-23-sub-04.png",
  "week-2026-11-23-sub-05": "week-2026-11-23-sub-05.png",
  "week-2026-11-23-ned-04": "week-2026-11-23-ned-04.png",
  "week-2026-11-23-ned-05": "week-2026-11-23-ned-05.png",
}

export function getQuestionVisualAssetPath(slug: string): string | undefined {
  const file = questionVisualAssetFiles[slug]
  return file ? import.meta.env.BASE_URL + "question-assets/" + file : undefined
}
