// Three states, not four. There used to be a 'production' badge sitting beside
// 'confidential', which drew a line that does not exist: everything built at
// work is internal, whether or not it is live. If it is not open source and it
// is not a personal experiment, it is confidential.
export type ProjectStatus = 'confidential' | 'open-source' | 'experiment'

export interface Project {
  slug: string
  title: string
  organization: string
  period: string
  description: string
  impact?: string
  tags: string[]
  status: ProjectStatus
  link?: string
}

export const projects: Project[] = [
  {
    slug: 'mypdi-agent-framework',
    title: 'MyPDI AI Agent Framework',
    organization: 'PDI Technologies',
    period: '2025 – Present',
    description:
      'A platform that lets any team define agents, teams of agents, and multi-step workflows from configuration, instead of rebuilding the same infrastructure for every new AI feature.',
    impact: 'Powers AI features across multiple MyPDI product lines',
    tags: ['Agentic AI', 'MCP', 'LLMs', 'Workflows', 'Multi-tenant'],
    status: 'confidential',
    link: '/articles/building-a-platform-for-agents',
  },
  {
    slug: 'mypdi-chatbot',
    title: 'MyPDI Customer-Facing Chatbot',
    organization: 'PDI Technologies',
    period: '2025 – Present',
    description:
      'A conversational assistant that holds coherent multi-turn conversations, routes each question to the right specialist automatically, and answers grounded in real business data.',
    impact: 'Grounded, multi-tenant conversational AI for retail and petroleum customers',
    tags: ['Chatbot', 'RAG', 'LLMs', 'Conversational AI', 'Agentic AI', 'Multi-tenant'],
    status: 'confidential',
    link: '/articles/a-chatbot-that-remembers',
  },
  {
    slug: 'mypdi-ingestion',
    title: 'MyPDI Document Ingestion Pipeline',
    organization: 'PDI Technologies',
    period: '2025 – Present',
    description:
      'The knowledge layer behind MyPDI: it turns messy real-world documents and structured sources into one consistent, queryable knowledge base, resiliently and without manual babysitting.',
    impact: 'Feeds reliable retrieval across the AI platform',
    tags: ['RAG', 'Ingestion', 'Knowledge Base', 'Data Pipelines', 'MLOps'],
    status: 'confidential',
    link: '/articles/the-ingestion-problem',
  },
  {
    slug: 'agentic-ticket-resolution',
    title: 'Agentic Ticket Resolution Recommender',
    organization: 'ConnectWise',
    period: '2024 – 2025',
    description:
      'An agentic AI system built on the Agno framework that analyzes millions of historical support tickets and recommends resolutions in real time.',
    impact: '60% reduction in resolution time, 40% drop in support costs',
    tags: ['Agno', 'Agentic AI', 'RAG', 'Python', 'FastAPI'],
    status: 'confidential',
  },
  {
    slug: 'agent-framework',
    title: 'Config-Driven Agentic AI Framework',
    organization: 'ConnectWise',
    period: '2024 – 2025',
    description:
      'A reusable framework for deploying config-driven AI agents via REST API, with support for memory, multi knowledge base retrieval, tool use, and enterprise integrations.',
    impact: 'Adopted across multiple internal products and teams',
    tags: ['Agentic AI', 'MCP', 'LLMs', 'FastAPI', 'MLOps', 'RAG'],
    status: 'confidential',
  },
  {
    slug: 'rag-framework',
    title: 'In-House RAG Framework',
    organization: 'ConnectWise',
    period: '2024 – 2025',
    description:
      'A low-code RAG framework that lets teams deploy retrieval augmented apps quickly, adopted organization wide by engineering and product.',
    impact: 'Adopted by all internal teams and product managers',
    tags: ['RAG', 'LLMs', 'Vector Search', 'Python'],
    status: 'confidential',
  },
  {
    slug: 'curie-rag',
    title: 'Curie: Large-Scale RAG Querying System',
    organization: 'Draup',
    period: '2021 – 2024',
    description:
      'An LLM powered RAG system that queries a corpus of 300M job descriptions and returns answers in under 10 seconds at production scale. That engine is the work here, started and built between 2021 and 2024. Draup carried it on afterwards and shipped it as Curie, a product they sell today — the link goes to that product page, which is their team\'s work, not to the system underneath it.',
    impact: 'Sub 10 second latency at 300M document scale — the groundwork Curie was later built on',
    tags: ['RAG', 'LLMs', 'NLP', 'Semantic Search'],
    // Stays 'confidential': the badge describes the work in this entry, which
    // was internal and cannot be shown. The link is to someone else's finished
    // product, and the description says so, so the two do not disagree.
    status: 'confidential',
    link: 'https://draup.com/curie',
  },
  {
    slug: 'domain-language-model',
    title: 'Domain-Pretrained Language Model',
    organization: 'Draup',
    period: '2021 – 2024',
    description:
      'A RoBERTa based language model pre-trained from scratch on 60M job descriptions to lift downstream NLP performance in the labor market domain.',
    impact: '5%+ gain on downstream NLP tasks',
    tags: ['Transformers', 'PyTorch', 'NLP', 'RoBERTa'],
    status: 'confidential',
  },
  // Sits at the end of the work grid, immediately before The Atlas: the grid
  // renders array order and stops before the experiments, so this closes the
  // work list while keeping the two 2026 personal projects next to each other.
  {
    slug: 'context-grid',
    title: 'context-grid',
    organization: 'Personal Project',
    period: '2026',
    description:
      'A test bench for the machinery that feeds documents to a language model. Almost every rule of thumb in this field is advice nobody measured, so this measures it on your own documents and your own questions, and ranks what comes out on quality, speed and cost. The answer key is stored as a stretch of characters in the original document rather than as a chunk number, so a set of test questions written once stays correct even after you change how the documents are cut up.',
    impact: 'On PyPI under MIT, still an early release — it turns retrieval folklore into numbers on your own documents.',
    tags: ['Python', 'RAG', 'Retrieval', 'Evaluation', 'Benchmarking', 'CLI'],
    status: 'open-source',
    // The documentation rather than the repository. It is the better first
    // stop -- it explains what the tool is for before showing the code -- and
    // it carries a link back to GitHub in its own header, so nothing is lost.
    // Served from /context-grid by a rewrite in next.config.js.
    link: '/context-grid',
  },
  {
    slug: 'the-atlas',
    title: 'The Atlas',
    organization: 'Personal Project',
    period: '2026',
    description:
      'An interactive world map where every country\'s data is engraved onto its own banknote. About 150 measures per country — population, economy, trade, health, education, environment, infrastructure — pulled live from the World Bank, Wikidata, Wikipedia, and UN Comtrade. Compare up to five countries side by side, rank every country by any measure, or trace its trade partners as arcs across the map. Each country also has its own story: motto, currency, languages, anthem, famous people, landmarks, history, and neighbours. Every number carries the year it\'s from, and a rank is left blank when too few countries report it.',
    impact: 'Built so people can learn about the world by poking at it, not by reading a table.',
    tags: ['Next.js', 'Data Visualization', 'Open Data', 'TypeScript'],
    status: 'experiment',
    link: '/atlas',
  },
]
