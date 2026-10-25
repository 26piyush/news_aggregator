import { NewsProvider, NormalizedArticle } from './types.js';

export const MOCK_ARTICLES: NormalizedArticle[] = [
  {
    providerArticleId: 'mock-tech-1',
    title: 'Open-Source AI Consortium Releases 70B Parameter Multimodal Foundation Model',
    description: 'Researchers from an international open-source coalition unveiled an open-weights multimodal architecture designed to reduce inference compute requirements while maintaining competitive benchmark performance.',
    content: 'The consortium announced the release under an Apache 2.0 permissive license. Benchmark evaluations on standard reasoning datasets indicated parity with leading proprietary systems while utilizing quantized memory footprints.',
    canonicalUrl: 'https://news.example.com/tech/open-source-multimodal-foundation-model',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    author: 'Elena Rostova',
    sourceName: 'AI Horizon Review',
    sourceDomain: 'aihorizon.org',
    category: 'technology',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30m ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-tech-2',
    title: 'Silicon Photonics Breakthrough Promises 10x Bandwidth for Data Center Interconnects',
    description: 'Semiconductor engineers demonstrated a monolithic silicon photonics transceiver capable of 1.6 Terabits per second per fiber with drastically reduced thermal dissipation.',
    content: 'By integrating optical modulators directly onto standard complementary metal-oxide-semiconductor (CMOS) dies, the team eliminated discrete packaging overheads and minimized parasitic capacitances.',
    canonicalUrl: 'https://news.example.com/tech/silicon-photonics-transceiver-bandwidth',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    author: 'Marcus Vance',
    sourceName: 'Semiconductor Daily',
    sourceDomain: 'semidaily.com',
    category: 'technology',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-biz-1',
    title: 'Federal Reserve Holds Benchmark Rate Steady as Inflation Data Shows Ongoing Moderation',
    description: 'The Federal Open Market Committee maintained the policy interest rate target range between 4.25% and 4.50%, highlighting balanced employment and price stability objectives.',
    content: 'Policymakers noted in their post-meeting statement that labor market indicators have normalized from previous overheated conditions, while core personal consumption expenditure measures showed steady disinflation.',
    canonicalUrl: 'https://news.example.com/business/fed-maintains-interest-rates-inflation-moderates',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    author: 'Sarah Jenkins',
    sourceName: 'Global Financial Times',
    sourceDomain: 'globalfinancialtimes.com',
    category: 'business',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180), // 3h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-biz-2',
    title: 'Global Renewable Energy Investment Surpasses Fossil Fuels for Third Consecutive Year',
    description: 'International Energy Agency report highlights that clean power expenditures reached $2.1 trillion in 2025, driven by grid-scale solar and battery storage adoption.',
    content: 'Rapid manufacturing scale-up in photovoltaic modules and lithium-iron-phosphate cells pushed installation costs down by 14% year-over-year across emerging markets.',
    canonicalUrl: 'https://news.example.com/business/renewable-energy-investment-record-2025',
    imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    author: 'David Chen',
    sourceName: 'Clean Energy Markets',
    sourceDomain: 'cleanenergymarkets.com',
    category: 'business',
    publishedAt: new Date(Date.now() - 1000 * 60 * 300), // 5h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-sci-1',
    title: 'James Webb Space Telescope Confirms Atmospheric Water Vapor on Terrestrial Exoplanet',
    description: 'Transmission spectroscopy of exoplanet LHS 1140 b reveals chemical signatures consistent with a substantial water-rich envelope and potential liquid ocean surface.',
    content: 'Located 48 light-years away in the constellation Cetus, the sub-Neptune candidate exhibits planetary density and equilibrium temperatures suitable for stable surface volatile layers.',
    canonicalUrl: 'https://news.example.com/science/jwst-confirms-water-vapor-lhs-1140b',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    author: 'Dr. Aris Thorne',
    sourceName: 'Astrophysical Gazette',
    sourceDomain: 'astrogazette.org',
    category: 'science',
    publishedAt: new Date(Date.now() - 1000 * 60 * 420), // 7h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-health-1',
    title: 'Clinical Trial Results Show Novel mRNA Therapeutic Halts Pancreatic Tumor Recurrence',
    description: 'A phase II multicenter clinical trial demonstrated statistically significant delay in disease recurrence for personalized neoantigen mRNA vaccines combined with immunotherapy.',
    content: 'Eighty-four patients enrolled in the trial received custom-synthesized vaccines targeting up to 20 patient-specific somatic mutations. Long-term T-cell persistence was documented in 78% of evaluable responders.',
    canonicalUrl: 'https://news.example.com/health/mrna-pancreatic-cancer-clinical-trial-results',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    author: 'Rachel Steinberg, MD',
    sourceName: 'Medical Sciences Journal',
    sourceDomain: 'medsciencesjournal.com',
    category: 'health',
    publishedAt: new Date(Date.now() - 1000 * 60 * 540), // 9h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-pol-1',
    title: 'Parliamentary Committee Proposes Stricter Regulations on Algorithmic Price Discrimination',
    description: 'Legislators presented draft statutes requiring digital marketplaces to disclose automated pricing adjustments and prevent exploitative consumer segmentation.',
    content: 'The legislative framework mandates periodic independent audits of dynamic pricing algorithms and establishes civil penalties for abusive pricing during declared emergencies.',
    canonicalUrl: 'https://news.example.com/politics/parliament-drafts-algorithmic-pricing-statute',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    author: 'Gareth Evans',
    sourceName: 'Policy & Governance Dispatch',
    sourceDomain: 'policydispatch.gov.uk',
    category: 'politics',
    publishedAt: new Date(Date.now() - 1000 * 60 * 660), // 11h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-sports-1',
    title: 'Championship Final Decided in Overtime Shootout with Historic Comeback Victory',
    description: 'Underdog contenders overturned a two-goal deficit in the closing minutes of regulation before securing victory in the sudden-death penalty shootout.',
    content: 'A roaring crowd of sixty thousand witnessed tactical adjustments that turned the match around. Defensive shifts and aggressive midfield pressing forced critical turnovers.',
    canonicalUrl: 'https://news.example.com/sports/championship-final-overtime-comeback',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    author: 'Liam O’Connor',
    sourceName: 'Global Athletics Weekly',
    sourceDomain: 'athleticsweekly.com',
    category: 'sports',
    publishedAt: new Date(Date.now() - 1000 * 60 * 780), // 13h ago
    provider: 'mock',
  },
  {
    providerArticleId: 'mock-world-1',
    title: 'International Maritime Treaty Establishes High-Seas Environmental Protection Corridors',
    description: 'Delegates from 140 nations ratified conservation zones encompassing critical migratory marine corridors across international waters.',
    content: 'The treaty establishes binding regulations on commercial bottom-trawling and deep-sea mining exploration within designated biodiversity hotspots.',
    canonicalUrl: 'https://news.example.com/world/high-seas-treaty-protects-ocean-corridors',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    author: 'Fatima Al-Mansoor',
    sourceName: 'World Affairs Monitor',
    sourceDomain: 'worldaffairsmonitor.org',
    category: 'world',
    publishedAt: new Date(Date.now() - 1000 * 60 * 900), // 15h ago
    provider: 'mock',
  },
  {
    // Article with deliberate loaded language to demonstrate linguistic cues detection
    providerArticleId: 'mock-op-1',
    title: 'Editorial: Urban Transit Overhaul is a Shocking and Unmitigated Disaster',
    description: 'Critics slam the municipality’s controversial traffic rerouting plan as a catastrophic failure that destroys commuter productivity and creates unprecedented gridlock.',
    content: 'The new express corridor is undeniably the most disastrous urban planning mistake in recent memory. Officials pushed forward a jaw-dropping scheme that everyone knows will fail, while ignoring citizen outcry.',
    canonicalUrl: 'https://news.example.com/politics/editorial-transit-overhaul-disaster',
    imageUrl: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=800&q=80',
    author: 'Julian Croft',
    sourceName: 'Metropolitan Observer',
    sourceDomain: 'metro-observer.com',
    category: 'politics',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120), // 2h ago
    provider: 'mock',
  }
];

export class MockNewsAdapter implements NewsProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async fetchArticles(categoryFilter?: string, queryFilter?: string): Promise<NormalizedArticle[]> {
    let list = [...MOCK_ARTICLES];
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter(a => a.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (queryFilter) {
      const q = queryFilter.toLowerCase();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    return list;
  }
}
