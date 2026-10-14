import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcContent, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// Portuguese (Portugal) version of the UGC search pages. Same structure as the German source in
// src/lib/seo-pages.ts and content-de.ts. Slugs and `niche` stay as they are (slugs are URLs). No invented
// numbers, quotes or testimonials, and no "escrow" wording: the money is "retido" (held).

const NBSP = " ";
const FEE = `${PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_PRICE = `${PRO_SUBSCRIPTION_PRICE_CENTS / 100}${NBSP}€`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "Como funciona o pagamento?",
      answer: `A marca paga através da plataforma e não diretamente ao criador. O dinheiro fica retido até o criador publicar, enviar a ligação e a marca aprovar a publicação. A marca tem ${RELEASE_REVIEW_DAYS} dias para isso e pode reportar um problema nesse período. Se não responder, o pagamento é libertado automaticamente. Os pagamentos passam pela Stripe.`,
    },
    {
      question: "Quanto custa o comtor?",
      answer: `O registo é gratuito e não há mensalidade. O comtor fica com ${FEE} de cada pagamento. A comissão é descontada do valor que o criador recebe. A marca paga exatamente o valor combinado. Marcas e criadores podem subscrever o Pro, opcional, por ${PRO_PRICE} por mês. Então a comissão é de ${PRO_FEE} em cada pagamento em que um dos dois lados tenha Pro.`,
    },
    {
      question: "As publicações pagas têm de ser identificadas como publicidade?",
      answer:
        "Na Alemanha, as publicações pagas têm, em regra, de ser identificadas como publicidade. Combinem a identificação no chat antes de publicar. Isto não é aconselhamento jurídico.",
    },
    {
      question: "Como é verificado o número de seguidores?",
      answer:
        "Os números são indicados pelos próprios criadores. Cada plataforma que um criador regista está ligada à conta real, por isso as marcas podem ver o número antes da primeira mensagem. As marcas definem um mínimo no pedido. Só os criadores que cumprem o requisito veem o pedido.",
    },
  ];
}

// The two questions about finding each other, for the pages that don't need a niche-specific answer.
function matchingFaqs(opts: {
  label: string;
  brandWho: string;
  creatorFrom: string;
  categories?: string;
}): UgcFaqItem[] {
  const hint = opts.categories ? ` (${opts.categories})` : "";
  return [
    {
      question: `Como encontro criadores para a minha ${opts.brandWho}?`,
      answer: `Publicas um pedido: nicho ${opts.label}, idioma do conteúdo, mínimo de seguidores, categoria do produto${hint}, orçamento, plataforma e o que deve ser entregue. Os criadores que escolheram ${opts.label} como nicho e que cumprem o idioma e o alcance veem-no no feed e contactam-te no chat se tiverem interesse. O comtor não revê os pedidos manualmente.`,
    },
    {
      question: `Onde encontro pedidos ${opts.creatorFrom}?`,
      answer: `Crias o teu perfil, escolhes até três nichos, por exemplo ${opts.label}, e indicas as tuas plataformas, cada uma com o número de seguidores. No feed, em «Para ti», vês pedidos dos teus nichos e, em «Todos», tudo o que cabe no teu idioma e alcance, sempre com orçamento e requisitos. Com um toque em «Interessado» abres o chat com a marca.`,
    },
  ];
}

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} e ${PLATFORMS[PLATFORMS.length - 1]}`;

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Beleza",
    title: "Encontrar criadores UGC para marcas de beleza",
    description:
      "Marcas de beleza encontram criadores UGC para vídeos de rotina, unboxings e fotos de produto. Criadores encontram trabalho pago no seu nicho. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de beleza",
    ogLines: ["Encontrar criadores UGC", "para marcas de beleza."],
    lead: "Cuidados de pele, maquilhagem, cabelo, perfumes: quem compra um produto de beleza quer ver como fica em pessoas reais. O comtor liga marcas de beleza a criadores que fazem exatamente estes vídeos e fotos. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Vídeo de rotina",
        text: "Rotina da manhã ou da noite, com o produto passo a passo. Funciona em orgânico e em anúncios.",
      },
      {
        title: "Unboxing e primeiras impressões",
        text: "Abrir, experimentar e dizer com honestidade o que se nota. Ideal para novidades e sets.",
      },
      {
        title: "Aplicação em detalhe",
        text: "Como se aplica, que textura tem, quanto tempo dura? Grandes planos em vez de estúdio.",
      },
      {
        title: "Fotos do dia a dia",
        text: "Fotos do produto na casa de banho, na mesa de maquilhagem ou em viagem, para loja, redes sociais e anúncios.",
      },
    ],
    faqs: [
      {
        question: "Como encontro criadores para a minha marca de beleza?",
        answer:
          "Publicas um pedido: nicho Beleza, idioma do conteúdo, mínimo de seguidores, categoria do produto, orçamento, plataforma e o que deve ser entregue. Os criadores que escolheram Beleza como nicho e que cumprem o idioma e o alcance veem-no no feed. Quem tiver interesse contacta-te no chat. O comtor não revê os pedidos manualmente.",
      },
      {
        question: "Onde encontro pedidos de marcas de beleza?",
        answer:
          "Crias o teu perfil, escolhes até três nichos, por exemplo Beleza, e indicas as tuas plataformas, cada uma com o número de seguidores. No feed, em «Para ti», vês pedidos dos teus nichos e, em «Todos», tudo o que cabe no teu idioma e alcance, sempre com orçamento e requisitos. Com um toque em «Interessado» abres o chat com a marca.",
      },
      {
        question: "Recebo o produto de graça?",
        answer:
          "Isso é a marca que define no pedido: lá consta se o produto está incluído. O resto, como o que é entregue e o prazo, combinam antes no chat.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "Encontrar criadores UGC para marcas de fitness",
    description:
      "Marcas de fitness encontram criadores UGC para vídeos de treino, testes de produto e demos de apps. Criadores encontram trabalho pago no seu nicho. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de fitness",
    ogLines: ["Encontrar criadores UGC", "para marcas de fitness."],
    lead: "Roupa desportiva, equipamento, suplementos, apps de fitness: no fitness convence o que as pessoas usam de verdade. O comtor liga marcas de fitness a criadores que mostram o treino e o dia a dia com credibilidade. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Treino com o produto",
        text: "Uma sessão de treino em que se vê roupa, equipamento ou acessórios em uso.",
      },
      {
        title: "Teste de produto após algumas semanas",
        text: "Balanço honesto: ajuste, durabilidade, utilização. Ajuda quem vai comprar a decidir.",
      },
      {
        title: "Dia a dia e rotina",
        text: "Plano de treino, preparação de refeições ou rotina da manhã, com o produto como parte natural do dia.",
      },
      {
        title: "Demo de app ou tracker",
        text: "Gravação de ecrã com comentário: como corre um treino com a app, o que mostra o tracker?",
      },
    ],
    faqs: [
      {
        question: "Como encontro criadores para a minha marca de fitness?",
        answer:
          "Publicas um pedido: nicho Fitness, idioma do conteúdo, mínimo de seguidores, categoria do produto (por exemplo roupa desportiva, suplementos ou app), orçamento, plataforma e o que deve ser entregue. Os criadores que escolheram Fitness como nicho e que cumprem o idioma e o alcance veem-no no feed e contactam-te no chat se tiverem interesse.",
      },
      {
        question: "Onde encontro pedidos de marcas de fitness?",
        answer:
          "Crias o teu perfil, escolhes até três nichos, por exemplo Fitness, e indicas as tuas plataformas, cada uma com o número de seguidores. No feed, em «Para ti», vês pedidos dos teus nichos e, em «Todos», tudo o que cabe no teu idioma e alcance. Com «Interessado» abres o chat.",
      },
      {
        question: "O que vale para suplementos e alegações de eficácia?",
        answer:
          "Para alegações sobre saúde e eficácia há regras rigorosas. No caso de suplementos alimentares, combinem no chat, antes da gravação, o que pode e o que não pode ser dito. Isto não é aconselhamento jurídico.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Comida",
    title: "Encontrar criadores UGC para marcas de comida",
    description:
      "Marcas de comida encontram criadores UGC para vídeos de receitas, provas e fotos de comida. Criadores encontram trabalho pago no seu nicho. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de comida",
    ogLines: ["Encontrar criadores UGC", "para marcas de comida."],
    lead: "Snacks, bebidas, especiarias, caixas de cozinha, ingredientes de pastelaria: em comida e bebida conta se a pessoa quer logo provar. O comtor liga marcas de comida a criadores que cozinham, provam e mostram. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Vídeo de receita",
        text: "Um prato ou bebida passo a passo, com o produto como ingrediente. Mostra como se usa.",
      },
      {
        title: "Prova e primeiras impressões",
        text: "Provar e descrever com honestidade o que se nota. Serve para novidades, sabores e packs de oferta.",
      },
      {
        title: "Unboxing de caixas de cozinha",
        text: "Abrir e apresentar uma caixa de cozinha, um pack de provas ou um cabaz de oferta.",
      },
      {
        title: "Dia a dia e preparação de refeições",
        text: "Pequeno-almoço, comida feita para a semana ou o snack a meio do dia: o produto como parte normal do dia.",
      },
      {
        title: "Fotos de comida",
        text: "Pratos e produtos fotografados, para loja, redes sociais e anúncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Comida",
        brandWho: "marca de comida",
        creatorFrom: "de marcas de comida",
        categories: "por exemplo, comida e bebida",
      }),
      {
        question: "Quem trata do envio dos produtos?",
        answer:
          "Combinam isso antes no chat. O pedido só diz se o produto está incluído. Como e quando chega, sobretudo com produtos refrigerados ou perecíveis, acertam antes.",
      },
      {
        question: "O que vale para alegações sobre saúde e eficácia?",
        answer:
          "Alegações como «saudável» ou «reforça o sistema imunitário» são rigorosamente reguladas nos alimentos. Combinem antes no chat o que pode ser dito. Isto não é aconselhamento jurídico.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Moda",
    title: "Encontrar criadores UGC para marcas de moda",
    description:
      "Marcas de moda encontram criadores UGC para vídeos de outfits, provadores e fotos de styling. Criadores encontram trabalho pago no seu nicho. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de moda",
    ogLines: ["Encontrar criadores UGC", "para marcas de moda."],
    lead: "Roupa, sapatos, acessórios, joias: compra-se moda porque a pessoa se imagina com ela. O comtor liga marcas de moda a criadores que vestem as peças, combinam-nas e mostram como assentam no dia a dia. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Vídeo de outfit",
        text: "Uma peça, vários looks: como combinar para o trabalho, o tempo livre e a noite.",
      },
      {
        title: "Prova com feedback honesto",
        text: "Corte, tecido e tamanho em comparação com a tabela de medidas, nas tuas palavras.",
      },
      {
        title: "Haul e unboxing",
        text: "Abrir a encomenda e apresentar as peças uma a uma.",
      },
      {
        title: "Fotos de styling no dia a dia",
        text: "Looks na rua, no café ou em casa, para loja, redes sociais e anúncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Moda",
        brandWho: "marca de moda",
        creatorFrom: "de marcas de moda",
      }),
      {
        question: "E o tamanho e o corte?",
        answer:
          "O tamanho combinam antes no chat, para a peça servir e a publicação correr bem. Se o produto está incluído, consta no pedido da marca.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tecnologia",
    title: "Encontrar criadores UGC para marcas de tecnologia",
    description:
      "Marcas de tecnologia encontram criadores UGC para unboxings, testes no dia a dia e demos de apps. Criadores encontram trabalho pago no seu nicho. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de tecnologia",
    ogLines: ["Encontrar criadores UGC", "para marcas de tecnologia."],
    lead: "Gadgets, acessórios, casa inteligente, software e apps: em tecnologia, quem compra quer ver como o produto funciona no dia a dia. O comtor liga marcas de tecnologia a criadores que abrem, configuram e explicam. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Unboxing e configuração",
        text: "Abrir, ligar, configurar: os primeiros minutos com o produto, tal como quem compra os vive.",
      },
      {
        title: "Teste no dia a dia",
        text: "Uma semana com o produto: o que funciona, o que irrita, para quem compensa?",
      },
      {
        title: "Demo de funcionalidade",
        text: "Gravação de ecrã ou grande plano com a explicação de uma função que costuma passar despercebida.",
      },
      {
        title: "Como se faz",
        text: "Tutorial curto: como resolvo um problema típico com o produto?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tecnologia",
        brandWho: "marca de tecnologia",
        creatorFrom: "de marcas de tecnologia",
        categories: "por exemplo, eletrónica ou software/app",
      }),
      {
        question: "Como tenho acesso a aparelhos ou software como criador?",
        answer:
          "Em aparelhos, a marca define no pedido se o produto está incluído. Em software e apps, combinam no chat como recebes acesso a uma conta de teste ou à versão completa.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Viagens",
    title: "Encontrar criadores UGC para empresas de viagens",
    description:
      "Hotéis, empresas de viagens e marcas de viagem encontram criadores UGC para reels de viagem, visitas ao alojamento e fotos. Começa grátis.",
    heading: "Encontrar criadores UGC para empresas de viagens",
    ogLines: ["Encontrar criadores UGC", "para empresas de viagens."],
    lead: "Hotéis, alojamento local, operadores turísticos, bagagem e apps de viagem: reserva-se uma viagem pelas imagens e experiências de outras pessoas. O comtor liga empresas de viagens a criadores que mostram lugares e alojamentos como se vivem no local. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Reel de viagem",
        text: "Um lugar em 30 segundos: chegada, os melhores momentos, uma dica para levar.",
      },
      {
        title: "Visita ao alojamento",
        text: "Quarto, vista, pequeno-almoço, pormenores: como é e como se sente de verdade.",
      },
      {
        title: "Três dicas no local",
        text: "Formato curto com sítios favoritos, comida e percursos fora do roteiro habitual.",
      },
      {
        title: "Lista de bagagem e acessórios de viagem",
        text: "Mala, mochila, adaptador: produtos em uso real em viagem.",
      },
      {
        title: "Série de fotos",
        text: "Imagens do lugar e do alojamento, para site, redes sociais e anúncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Viagens",
        brandWho: "empresa de viagens",
        creatorFrom: "do setor das viagens",
      }),
      {
        question: "Quem paga a viagem e o alojamento?",
        answer:
          "Combinam isso antes no chat e registam por escrito. O pedido indica o orçamento para a publicação. Se a viagem, o alojamento ou serviços no local estão incluídos, acordam-no de forma expressa.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "Encontrar criadores UGC para marcas de gaming",
    description:
      "Marcas de gaming encontram criadores UGC para clips de gameplay, testes de hardware e primeiras impressões. Criadores encontram trabalho pago. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de gaming",
    ogLines: ["Encontrar criadores UGC", "para marcas de gaming."],
    lead: "Jogos, consolas, hardware de PC, acessórios e apps de gaming: os jogadores confiam em quem joga a sério. O comtor liga marcas de gaming a criadores que jogam, testam e comentam. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Clip de gameplay",
        text: "Uma cena do jogo com comentário: o que o torna especial, o que salta à vista?",
      },
      {
        title: "Primeiras impressões",
        text: "As primeiras horas num jogo novo, abertas e sem guião.",
      },
      {
        title: "Teste de hardware",
        text: "Rato, headset, teclado ou comando em uso: sensação, qualidade, adequação ao dia a dia.",
      },
      {
        title: "Destaques de uma stream ou sessão",
        text: "Os melhores momentos de uma stream ou de uma sessão de jogo, com uma edição curta.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "marca de gaming",
        creatorFrom: "de marcas de gaming",
      }),
      {
        question: "Em que plataformas posso publicar?",
        answer: `Os criadores registam as suas plataformas, cada uma com o número de seguidores: ${PLATFORM_LIST}. A marca define no pedido onde se deve publicar.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Estilo de vida",
    title: "Encontrar criadores UGC para marcas de estilo de vida",
    description:
      "Marcas de estilo de vida encontram criadores UGC para vídeos do dia a dia, looks de casa e fotos de produto. Criadores encontram trabalho pago. Começa grátis.",
    heading: "Encontrar criadores UGC para marcas de estilo de vida",
    ogLines: ["Encontrar criadores UGC", "para marcas de estilo de vida."],
    lead: "Casa, tarefas domésticas, organização, bem-estar, acessórios: os produtos de estilo de vida convencem quando se veem no dia a dia real. O comtor liga marcas de estilo de vida a criadores que mostram o seu quotidiano. Os criadores encontram aqui trabalho pago no seu nicho.",
    formats: [
      {
        title: "Um dia com o produto",
        text: "Da manhã à noite: onde o produto aparece no dia a dia e o que facilita.",
      },
      {
        title: "Look de casa",
        text: "Casa, canto ou estante decorados com o produto. Mostra como fica numa casa real.",
      },
      {
        title: "Unboxing e montagem",
        text: "Abrir, montar, experimentar, incluindo os obstáculos pelo caminho.",
      },
      {
        title: "Rotina e hábitos",
        text: "Rotina da manhã, da noite ou de domingo, em que o produto surge de forma natural.",
      },
      {
        title: "Fotos do quotidiano",
        text: "Fotos de produto em situações reais, para loja, redes sociais e anúncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Estilo de vida",
        brandWho: "marca de estilo de vida",
        creatorFrom: "de marcas de estilo de vida",
      }),
      {
        question: "E se o meu conteúdo mistura vários temas?",
        answer:
          "Podes escolher até três nichos, por exemplo Estilo de vida, Moda e Comida. No feed, em «Para ti», vês primeiro os pedidos desses nichos e, em «Todos», tudo o que cabe no teu idioma e alcance.",
      },
      ...sharedFaqs(),
    ],
  },
];

const hubFaqs: UgcFaqItem[] = [
  {
    question: "O que é UGC?",
    answer:
      "UGC significa User Generated Content. Em marketing, são vídeos e fotos que pessoas reais criam para uma marca: experimentam o produto, filmam, mostram. A marca usa-os nos seus canais, na loja ou em anúncios. Conta o conteúdo, não o alcance do criador.",
  },
  {
    question: "Qual é a diferença para o marketing de influenciadores?",
    answer:
      "No marketing de influenciadores, o foco está no alcance de uma pessoa: a publicação aparece no canal dela. No UGC, o foco está no conteúdo, e criadores mais pequenos também podem entregar bons vídeos. No comtor, a marca define no pedido a plataforma e o mínimo de seguidores que quer, e pode deixar ambos em aberto.",
  },
  {
    question: "Como encontro criadores UGC para a minha marca?",
    answer:
      "Crias gratuitamente um perfil de marca e publicas um pedido: nicho, idioma, categoria do produto, orçamento e o que deve ser entregue. Os criadores certos veem-no no feed e contactam-te no chat.",
  },
  ...sharedFaqs(),
];

const creator = {
  title: "Ganhar dinheiro como criador UGC",
  description:
    "Encontra trabalho pago de marcas como criador UGC: vê pedidos com orçamento, combina no chat, recebe através da plataforma. Grátis.",
  heading: "Ganhar dinheiro como criador UGC",
  ogLines: ["Ganhar dinheiro", "como criador UGC."] as [string, string],
  lead: "Os criadores UGC fazem vídeos e fotos para marcas, como um cliente real mostraria um produto. No comtor vês pedidos pagos com orçamento e requisitos, mostras interesse com um toque e combinas o resto no chat. Recebes através da plataforma.",
  doing: [
    {
      title: "Vídeos de produto",
      text: "Experimentar um produto, filmar e mostrar com honestidade como funciona no dia a dia.",
    },
    {
      title: "Unboxings e primeiras impressões",
      text: "Abrir, experimentar, dizer o que se nota. Sem estúdio, mas com credibilidade.",
    },
    {
      title: "Demonstrações e tutoriais",
      text: "Mostrar passo a passo como se usa um produto e o que ele facilita.",
    },
    {
      title: "Fotos em situações reais",
      text: "Fotos de produto no dia a dia, para loja, redes sociais e anúncios da marca.",
    },
  ],
  steps: [
    "Cria o perfil: escolhe até três nichos, indica as tuas plataformas, cada uma com o número de seguidores, e o idioma do teu conteúdo.",
    "Vê os pedidos: no feed vês orçamento, plataforma e o que deve ser entregue, antes de contactares.",
    "Mostra interesse: com «Interessado» abres o chat com a marca e combinas detalhes e prazo.",
    "Publica e envia a ligação: depois de publicares, envias a ligação da tua publicação.",
    `Recebe: a marca aprova a publicação, no máximo ao fim de ${RELEASE_REVIEW_DAYS} dias, e o pagamento é transferido para ti.`,
  ],
  tips: [
    {
      title: "Mostra o produto cedo",
      text: "Nos primeiros segundos deve ficar claro do que se trata e o que o produto faz.",
    },
    {
      title: "Fala com naturalidade",
      text: "Impressões honestas nas tuas palavras convencem, na maioria dos casos, mais do que um texto decorado.",
    },
    {
      title: "Cuida da luz e do som",
      text: "Luz natural e um sítio calmo costumam chegar. Boa imagem e som limpo destacam-se.",
    },
    {
      title: "Esclarece o uso antes",
      text: "Combina no chat onde a marca pode usar o teu conteúdo, antes de gravares.",
    },
  ],
  faqs: [
    {
      question: "Preciso de muitos seguidores?",
      answer:
        "Isso é a marca que define: cada pedido indica um mínimo de seguidores, e algumas marcas não põem limite. Em «Para ti» vês pedidos dos teus nichos e, em «Todos», tudo o que cabe no teu idioma e alcance.",
    },
    {
      question: "Em que plataformas posso publicar?",
      answer: `Registas as tuas plataformas com o número de seguidores: ${PLATFORM_LIST}. A marca define no pedido onde se deve publicar.`,
    },
    {
      question: "Em quanto tempo recebo o dinheiro?",
      answer: `Assim que a marca aprova a tua publicação, o pagamento segue para ti. A marca tem ${RELEASE_REVIEW_DAYS} dias para isso. Se não responder, o pagamento é libertado automaticamente. O pagamento passa pela Stripe.`,
    },
    {
      question: "Tenho de registar atividade como criador UGC?",
      answer:
        "Depende da tua situação, por exemplo de quantas vezes e quanto ganhas. Na Alemanha, em regra, tens de declarar os rendimentos nos impostos. Em caso de dúvida, pergunta a um contabilista ou consultor fiscal. Isto não é aconselhamento fiscal nem jurídico.",
    },
    ...sharedFaqs(),
  ],
};

export const ugcContentPt: UgcContent = {
  htmlLang: "pt",
  ogLocale: "pt_PT",
  ui: {
    hubTitle: "Encontrar e contratar criadores UGC",
    hubDescription:
      "Marcas encontram criadores UGC para vídeos e fotos, criadores encontram trabalho pago. Publica um pedido, combina no chat, paga através da plataforma. Grátis.",
    hubIntro:
      "As marcas precisam de vídeos e fotos de pessoas reais, e os criadores querem ser pagos por isso. O comtor junta os dois: a marca publica um pedido, os criadores certos contactam-na, o pagamento passa pela plataforma.",
    signupNote: "Regista-te grátis. O comtor corre no browser e escolhes o idioma no arranque.",
    creatorCardTitle: "És criador?",
    creatorCardBody:
      "Assim encontras trabalho UGC pago e recebes através da plataforma: ganhar dinheiro como criador UGC.",
    byNicheTitle: "UGC por nicho",
    howTitle: "Como funciona o comtor",
    forBrands: "Para marcas",
    forCreators: "Para criadores",
    hubBrandSteps: [
      "Publica um pedido: nicho, idioma, mínimo de seguidores, categoria do produto, orçamento e o que deve ser entregue.",
      "Os criadores contactam-te: quem cumpre os requisitos vê o pedido no feed e escreve-te no chat.",
      "Paga e aprova: pagas através da plataforma e aprovas a publicação quando estiver certa.",
    ],
    hubCreatorSteps: [
      "Cria o perfil: até três nichos e as tuas plataformas, cada uma com o número de seguidores.",
      "Vê os pedidos: no feed vês orçamento e requisitos antes de contactares.",
      "Publica e recebe: depois de publicares, envias a ligação. Quando a marca a aprova (no máximo ao fim de {days} dias), o pagamento é transferido.",
    ],
    faqTitle: "Perguntas frequentes",
    formatsTitle: "Formatos que funcionam no nicho «{label}»",
    nicheBrandSteps: [
      "Publica um pedido: nicho {label}, idioma, mínimo de seguidores, orçamento e o que deve ser entregue.",
      "Os criadores contactam-te: quem cumpre os requisitos vê o pedido no feed e escreve-te no chat.",
      "Paga e aprova: pagas através da plataforma e aprovas a publicação quando estiver certa.",
    ],
    nicheCreatorSteps: [
      "Cria o perfil: até três nichos, por exemplo {label}, e as tuas plataformas, cada uma com o número de seguidores.",
      "Vê os pedidos: no feed vês orçamento e requisitos antes de contactares.",
      "Publica e recebe: depois de publicares, envias a ligação. Quando a marca a aprova (no máximo ao fim de {days} dias), o pagamento é transferido.",
    ],
    nicheReadyTitle: "Pronto para o teu primeiro trabalho no nicho «{label}»?",
    overviewLead: "O que é o UGC e como funciona o comtor, explicamos na visão geral:",
    overviewLink: "Encontrar criadores UGC",
    creatorCrumb: "Ser criador",
    creatorFooterLink: "Ser criador",
    creatorDoingTitle: "O que fazem os criadores UGC",
    creatorStartTitle: "Como começas no comtor",
    creatorTipsTitle: "Dicas para bom conteúdo UGC",
    creatorReadyTitle: "Pronto para o teu primeiro trabalho pago?",
    creatorBrandHint: "Procuras criadores para a tua marca? O que é o UGC e como funciona o comtor, explicamos na visão geral:",
    nicheNavLabel: "UGC por nicho",
  },
  niches,
  hubFaqs,
  creator,
};
