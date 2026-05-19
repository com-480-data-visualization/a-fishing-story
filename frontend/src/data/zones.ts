export type Zone = {
  id: string
  name: string
  lon: number
  lat: number
  zoom: number
  color: string
  description: string
}

export const ZONES: Zone[] = [
  {
    id: 'south-china-sea',
    name: 'South China Sea',
    lon: 114.0,
    lat: 14.0,
    zoom: 4,
    color: '#FF6B6B',
    description: [
      'The South China Sea is one of the world\'s most contested maritime regions, with overlapping territorial claims between China, Taiwan, Vietnam, the Philippines, Malaysia, and Brunei.',
      'China asserts sovereignty over most of the sea through its "nine-dash line," a claim rejected by a 2016 international tribunal ruling. Beijing has constructed artificial islands on reefs and atolls, equipping them with military infrastructure and fishing support facilities.',
      'The sea carries roughly one-third of global maritime trade — an estimated $3.4 trillion per year — making it strategically vital. It is also one of the world\'s most productive fisheries, supporting the livelihoods of hundreds of millions of people across Southeast Asia.',
      'Data shows an overwhelming concentration of Chinese-flagged vessels, many operating inside the EEZs of neighboring states. The region consistently ranks among the highest globally for IUU (illegal, unreported, unregulated) fishing incidents.',
    ].join('\n\n'),
  },
  {
    id: 'grand-banks',
    name: 'Grand Banks',
    lon: -52.0,
    lat: 46.5,
    zoom: 5,
    color: '#4ECDC4',
    description: [
      'The Grand Banks, located off the southeastern coast of Newfoundland, Canada, were once the most productive fishing grounds on Earth. For centuries, European fleets crossed the Atlantic specifically to fish these shallow, nutrient-rich waters.',
      'In 1992, after decades of industrial overfishing — primarily of Atlantic cod — Canada declared a complete moratorium on cod fishing. The stocks had collapsed to less than 1% of their historical levels. The closure devastated coastal communities across Newfoundland and Labrador, putting 35,000 fishers and plant workers out of work overnight.',
      'Over 30 years later, recovery remains incomplete and deeply uncertain. While some species have rebounded, cod populations are still a fraction of their historical size. The Grand Banks today host fleets targeting crab, shrimp, and other species, with strict quota regimes managed by NAFO (Northwest Atlantic Fisheries Organization).',
      'This zone is a cautionary tale for global fisheries management — and a benchmark against which the data in this visualization can be read.',
    ].join('\n\n'),
  },
  {
    id: 'west-africa',
    name: 'West Africa',
    lon: -17.0,
    lat: 12.0,
    zoom: 4.5,
    color: '#FFD166',
    description: [
      'West African waters — stretching from Mauritania to Guinea-Bissau — are among the richest fishing grounds in the world, yet also among the most systematically exploited by foreign fleets.',
      'Countries including China, Russia, South Korea, and the EU have signed bilateral fisheries access agreements with coastal states, but enforcement is weak and the terms are often opaque. A significant proportion of fishing activity occurs without proper authorization inside the EEZs of Senegal, Guinea, and Sierra Leone.',
      'Illegal, unreported, and unregulated (IUU) fishing costs the region an estimated $2.3 billion per year in lost revenue. Beyond economics, the depletion of near-shore fish stocks directly undermines food security for millions of people who depend on fish as their primary protein source.',
      'The data shows a persistent pattern: foreign-flagged vessels concentrated inside EEZs where local fleets should have exclusive rights. The contrast with local fishing activity is stark.',
    ].join('\n\n'),
  },
  {
    id: 'bering-sea',
    name: 'Bering Sea',
    lon: -174.0,
    lat: 59.0,
    zoom: 4,
    color: '#A8E6CF',
    description: [
      'The Bering Sea, wedged between Alaska and Russia, is one of the most productive marine ecosystems on the planet. Its cold, nutrient-upwelling waters support enormous populations of walleye pollock — the basis of the largest single-species fishery in the US by volume — along with king crab, halibut, and Pacific salmon.',
      'The sea is split between the US and Russian EEZs, with a maritime boundary defined by the 1990 US-USSR maritime boundary agreement (which Russia still has not formally ratified). Both countries maintain large industrial fishing fleets here.',
      'Climate change is rapidly transforming the Bering Sea: sea ice extent has hit record lows in recent years, pushing cold-water species northward and disrupting traditional fishing patterns. New species are appearing, and Arctic shipping routes are opening — raising new questions about access, sovereignty, and ecosystem management.',
      'The vessel data for this zone reveals intense, year-round industrial activity — a striking contrast to more seasonal zones elsewhere.',
    ].join('\n\n'),
  },
  {
    id: 'north-sea',
    name: 'North Sea',
    lon: 3.0,
    lat: 56.5,
    zoom: 4,
    color: '#C9B1FF',
    description: [
      'The North Sea is one of the most intensively managed fisheries in the world, bordered by the UK, Norway, Denmark, Germany, the Netherlands, Belgium, and France. It has been a cornerstone of European fishing culture and commerce for centuries.',
      'Overfishing through the 20th century led to dramatic stock collapses — North Sea cod fell to roughly 5% of sustainable levels by the early 2000s. This triggered a major overhaul of EU fisheries policy, including Total Allowable Catches (TACs), mesh size regulations, and seasonal closures.',
      'Brexit added a new layer of complexity: the UK reclaimed control over its EEZ waters in 2021, triggering multi-year negotiations with the EU over quota allocations. The transition has reshaped fishing patterns, with some EU fleets losing access to previously available areas.',
      'Despite management improvements, environmental pressures remain intense: bottom trawling continues to damage seabed habitats, and offshore wind farm expansion is creating new conflicts for traditional fishing grounds. The North Sea is a live laboratory for balancing ecological recovery with economic dependency.',
    ].join('\n\n'),
  },
]
