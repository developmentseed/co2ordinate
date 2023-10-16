import { useMemo } from 'react'

export default function useEquivalent(currentResult) {
  return useMemo(() => {
    if (!currentResult) return null
    const formatEquivalent = (currentResult, factor) =>
      (currentResult.properties.totalCO2 / factor).toFixed(2)
    const text = [
      [
        `🇮🇳 approx. ${formatEquivalent(currentResult, 1930)} 
  times what an average Indian citizen emits per year`,
        'https://ourworldindata.org/grapher/co-emissions-per-capita',
      ],
      [
        `🧊 equivalent to approx. ${formatEquivalent(
          currentResult,
          1000 / 3
        )}  square meters of Arctic sea ice loss`,
        'https://science.sciencemag.org/content/354/6313/747',
      ],
      [
        `🍔 equivalent to the emissions of approx. ${formatEquivalent(
          currentResult,
          1.8
        )} cheese burgers`,
        'https://www.sixdegreesnews.org/archives/10261/the-carbon-footprint-of-a-cheeseburger',
      ],
      [
        `🚗 equivalent to approx. ${formatEquivalent(
          currentResult,
          0.15
        )} kilometers travelled with a small car`,
        'https://ourworldindata.org/travel-carbon-footprint',
      ],
      [
        `🤑 equivalent to approx. US$${formatEquivalent(
          currentResult,
          1000 / 132.38
        )}, according to the Swiss carbon tax`,
        'https://www.iea.org/policies/17762-swiss-carbon-tax',
      ],
    ][Math.floor(Math.random() * 5)]

    return text
  }, [currentResult])
}
