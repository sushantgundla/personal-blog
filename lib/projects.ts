export type ProjectStatus = 'production' | 'confidential' | 'open-source'

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
    status: 'production',
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
    tags: ['Chatbot', 'RAG', 'LLMs', 'Conversational AI'],
    status: 'production',
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
    tags: ['RAG', 'Ingestion', 'Knowledge Base', 'Data Pipelines'],
    status: 'production',
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
    tags: ['Agentic AI', 'MCP', 'LLMs', 'FastAPI', 'MLOps'],
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
      'An LLM powered RAG system that queries a corpus of 300M job descriptions and returns answers in under 10 seconds at production scale.',
    impact: 'Sub 10 second latency at 300M document scale',
    tags: ['RAG', 'LLMs', 'NLP', 'Semantic Search'],
    status: 'confidential',
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
]
