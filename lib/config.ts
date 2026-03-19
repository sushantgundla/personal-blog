export const siteConfig = {
  name: 'Sushant Gundla',
  title: 'Sushant Gundla',
  description: 'Senior AI Engineer. Building agentic AI systems, RAG frameworks, and LLM pipelines at scale.',
  url: 'https://sushantgundla.com',
  tagline: 'Senior AI Engineer. Builder. Writer.',
  bio: `I'm a Senior AI Engineer at ConnectWise, building agentic AI systems and RAG frameworks that serve enterprise teams at scale. With 6+ years of experience across Generative AI, NLP, and Computer Vision, I specialize in turning complex AI research into production systems that drive real business impact.

I've built agentic ticket resolution systems handling millions of records, architected in-house RAG frameworks used across entire organizations, and deployed LLM pipelines that cut support costs by 50%.

I write about building AI systems, agentic architectures, and the lessons I pick up along the way. This blog is where I think out loud.`,
  email: 'hello@sushantgundla.com',
  social: {
    twitter: 'https://x.com/sushantgundla',
    github: 'https://github.com/sushantgundla',
    linkedin: 'https://www.linkedin.com/in/sushantgundla/',
  },
  work: [
    {
      company: 'ConnectWise',
      role: 'Senior Machine Learning Engineer II',
      period: 'Feb 2024 — Present',
      location: 'Bengaluru, India · Hybrid',
      highlights: [
        'Built Agentic Ticket Resolution Recommender using the Agno framework over millions of historical records — 60% reduction in resolution time, 40% drop in support costs',
        'Designed and shipped an Agentic AI framework for config-driven agents deployed via REST API, supporting memory, multi-KB retrieval, tool use, and enterprise integrations',
        'Architected an in-house RAG framework enabling low-code RAG app deployment — adopted by all internal teams and product managers',
        'Built an internal chatbot for employee and client queries integrating HR, cybersecurity, and university knowledge bases — 50% reduction in support resolution time',
      ],
    },
    {
      company: 'Draup',
      role: 'Data Scientist III',
      period: 'Sep 2021 — Feb 2024',
      location: 'Bengaluru, India · On-site',
      highlights: [
        'Pre-trained an in-house RoBERTa-based language model on 60M job descriptions — 5%+ performance gain on downstream NLP tasks',
        'Led development of Curie, an LLM-powered RAG querying system over 300M job descriptions responding in under 10 seconds at production scale',
        'Designed Skill Clustering algorithm with 93% top-5 accuracy using Sentence Transformers semantic similarity',
      ],
    },
    {
      company: 'Accolite Digital',
      role: 'Senior AI/ML Developer',
      period: 'Jul 2019 — Sep 2021',
      location: 'Bengaluru, India · On-site',
      highlights: [
        'Engineered a real-time Information Retrieval system for 40+ ID card types across 13 countries using SSOD, Heatmap Regression, and OCR — 95% F1-score',
        'Architected end-to-end ML microservice pipelines using Django, Docker, and AKS for GPU-node deployment',
        'Built CNN-LSTM model achieving 92% F1-score for detecting criticality in radiology reports',
      ],
    },
  ],
  education: [
    {
      school: 'COEP Technological University',
      degree: 'M.Tech, Computer Engineering (Information Security)',
      period: '2017 — 2019',
      grade: '9.54 CGPA',
    },
    {
      school: 'KJ Somaiya College of Engineering',
      degree: 'B.Tech, Computer Engineering',
      period: '2012 — 2016',
    },
  ],
  skills: [
    { label: 'Agentic AI', color: 'violet' },
    { label: 'RAG', color: 'orange' },
    { label: 'LLMs', color: 'blue' },
    { label: 'NLP', color: 'green' },
    { label: 'Computer Vision', color: 'pink' },
    { label: 'OpenAI', color: 'teal' },
    { label: 'LangChain', color: 'violet' },
    { label: 'FastAPI', color: 'green' },
    { label: 'AWS', color: 'orange' },
    { label: 'Kubernetes', color: 'blue' },
    { label: 'Docker', color: 'blue' },
    { label: 'PyTorch', color: 'orange' },
    { label: 'MLOps', color: 'teal' },
    { label: 'Transformers', color: 'violet' },
  ],
}
