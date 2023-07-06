import { useMemo } from 'react'

export default function useEquivalent(currentResult) {
  return useMemo(() => {
    if (!currentResult) return null
    const formatCO2 = (currentResult, factor) =>
      (currentResult.properties.totalCO2 / factor).toFixed(2)
    return [
      [
        `🇮🇳 approx. ${formatCO2(currentResult, 1930)} 
  times what an average Indian citizen emits per year`,
        'https://ourworldindata.org/grapher/co-emissions-per-capita',
      ],
      [
        `🧊 equivalent to approx. ${formatCO2(
          currentResult,
          1000 / 3
        )}  square meters of Arctic sea ice loss`,
        'https://science.sciencemag.org/content/354/6313/747',
      ],
      [
        `🍔 equivalent to the emissions of approx. ${formatCO2(
          currentResult,
          1.8
        )} cheese burgers`,
        'https://www.sixdegreesnews.org/archives/10261/the-carbon-footprint-of-a-cheeseburger',
      ],
      [
        `🚗 equivalent to approx. ${formatCO2(
          currentResult,
          0.15
        )} kilometers travelled with a small car`,
        'https://ourworldindata.org/travel-carbon-footprint',
      ],
    ][Math.floor(Math.random() * 4)]
  }, [currentResult])
}
