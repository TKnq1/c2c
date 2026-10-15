import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// The Portuguese (Portugal) legal texts, a convenience translation of en.ts. Keep them in step with en.ts and
// de.ts when those change (the German version governs).
function ptTerms(): LegalSection[] {
  return [
  {
    title: "Âmbito e operador",
    body: [
      "Estes termos aplicam-se à tua utilização da comtor (comtor.app). O operador é Teethawat Kanpai, empresário em nome individual (Einzelunternehmen) em Berlim, Alemanha (ver Impressum). Ao criares uma conta, aceitas estes termos. Para utilizadores na Alemanha, aplica-se a versão alemã destes termos.",
      "A comtor é apenas a plataforma técnica. Uma colaboração é um contrato entre a marca e o criador. O operador não é parte nesse contrato, não emprega o criador e não vende o produto da marca.",
    ],
  },
  {
    title: "Quem pode usar a comtor",
    body: [
      "Tens de ter pelo menos 18 anos ou de ter poderes para vincular a empresa em nome da qual atuas. És responsável pelo teu início de sessão e por tudo o que consta do teu perfil ser verdadeiro. Uma conta por pessoa ou empresa.",
    ],
  },
  {
    title: "O serviço",
    body: [
      "As marcas publicam um pedido: o que querem que seja feito, em que plataforma, com que orçamento e até quando. Os criadores que se adequam podem manifestar interesse, acordar um preço no chat e receber o pagamento através da comtor.",
      "Não prometemos uma correspondência, um número de visualizações, uma venda nem qualquer rendimento. O que ganhas ou gastas depende dos acordos que fechares com outros utilizadores.",
    ],
  },
  {
    title: "O que carregas",
    body: [
      "Manténs os direitos sobre o que carregas. Autorizas-nos a alojá-lo, a mostrá-lo a outros utilizadores e a guardar uma cópia de segurança, enquanto permanecer na comtor, para que o serviço possa funcionar. Esta autorização termina quando o conteúdo é eliminado, exceto quanto às cópias que somos obrigados por lei a conservar.",
      "O trabalho que um criador produz para uma marca pertence a quem ambos acordarem. Não adquirimos direitos sobre esse trabalho.",
    ],
  },
  {
    title: "A tua responsabilidade",
    body: [
      "As marcas são responsáveis pelos seus pedidos, pelas suas alegações sobre o produto e pelos direitos sobre as fotografias que carregam. Os criadores são responsáveis pelas suas publicações e têm de as identificar como publicidade sempre que a lei o exigir (na Alemanha, por exemplo, como «Werbung» ou «Anzeige»).",
      "Se uma marca enviar um produto, esse envio é uma questão entre a marca e o criador. Não o vendemos nem o enviamos. Uma caução, quando um pedido a exige, é uma garantia entre os dois e não uma taxa nossa.",
      "Se um terceiro apresentar uma reclamação contra nós por causa de conteúdo que carregaste, de um produto que enviaste ou de uma colaboração que acordaste, e a culpa for tua, assumes a reclamação e os custos razoáveis da defesa. Se fores consumidor, isto só se aplica na medida em que a lei o permita.",
    ],
  },
  {
    title: "Taxas",
    body: [
      `Cobramos uma comissão de plataforma de ${PLATFORM_FEE_RATE * 100}% sobre cada pagamento feito através da comtor. As marcas podem subscrever o Pro por ${formatCents(PRO_PRICE_CENTS.brand)}/mês e os criadores por ${formatCents(PRO_PRICE_CENTS.creator)}/mês. Enquanto o Pro estiver ativo, a comissão é de ${PRO_PLATFORM_FEE_RATE * 100}% em cada pagamento em que a marca ou o criador tenha Pro. O Pro renova-se todos os meses até o cancelares nas Definições. O cancelamento impede a renovação seguinte. Não há taxa de publicação. As primeiras ${FOUNDING_BRAND_LIMIT} marcas (founding brands) e os primeiros ${FOUNDING_CREATOR_LIMIT} criadores (founding creators) que se registaram na comtor recebem o Pro gratuitamente enquanto a sua conta existir. Esse Pro não tem preço mensal, não é transmissível e termina com a conta. Podemos retirá-lo se alguém violar estes termos.`,
      "A comissão de plataforma só é retida quando um pagamento é libertado ao criador. Se um pagamento retido for reembolsado, a marca recebe esse pagamento de volta e não retemos qualquer comissão sobre ele.",
    ],
  },
  {
    title: "Pagamentos retidos para ti",
    body: [
      `Quando uma marca paga, retemos o dinheiro até o criador submeter a ligação para a publicação em direto. A marca dispõe então de ${RELEASE_REVIEW_DAYS} dias para a aprovar, o que liberta o pagamento ao criador deduzida a nossa comissão, ou para comunicar um problema. Se a marca não fizer nenhuma das duas coisas, o pagamento é libertado. Se for comunicado um problema, o dinheiro permanece retido enquanto o analisamos e depois libertamo-lo ao criador ou reembolsamo-lo à marca.`,
      "Uma marca pode cancelar e ser reembolsada antes de o criador submeter a ligação. Depois de um pagamento ter sido libertado, não pode ser revertido através da comtor. Os pagamentos por cartão e os recebimentos são processados pela Stripe. Nunca vemos o número completo do cartão.",
    ],
  },
  {
    title: "Conduta",
    body: [
      "Não inventes números de seguidores, não publiques avaliações falsas, não carregues nada sobre o qual não tenhas direitos nem transfiras um negócio para fora da comtor para evitar a comissão. Podemos remover conteúdo e suspender ou encerrar uma conta que viole estes termos ou a lei.",
      "Para denunciar conteúdo ilegal, ou para nos pedires que reapreciemos algo que removemos, escreve para info@comtor.app. Vamos analisar o assunto e comunicar-te o resultado.",
      "Se removermos conteúdo ou suspendermos uma conta, comunicamos-te o motivo por e-mail. Podes contestar a decisão em info@comtor.app. Vamos reapreciá-la e responder-te.",
      "Só os utilizadores cuja colaboração tenha sido concluída e paga através da comtor podem deixar uma avaliação.",
    ],
  },
  {
    title: "Responsabilidade",
    body: [
      "Respondemos sem limitação em caso de dolo e negligência grosseira, por danos à vida, ao corpo ou à saúde e nos termos da lei da responsabilidade decorrente de produtos (Produkthaftungsgesetz). Em caso de negligência leve, só respondemos se violarmos uma obrigação essencial do contrato, e apenas pelos danos típicos e previsíveis neste tipo de contrato.",
      "Se fores uma empresa, essa responsabilidade por negligência leve é limitada às taxas que nos pagaste nos doze meses anteriores à reclamação ou a 100 €, se tiveres pago menos. Este limite não se aplica aos casos do parágrafo anterior.",
      "Não respondemos pela qualidade, legalidade ou calendarização de uma colaboração, de uma publicação ou de um produto que os utilizadores acordem entre si.",
    ],
  },
  {
    title: "Encerramento da tua conta",
    body: [
      "Podes eliminar a tua conta nas Definições. Podemos suspender ou encerrar uma conta que viole estes termos. Os pagamentos em aberto são concluídos de acordo com as regras de pagamento acima.",
    ],
  },
  {
    title: "Se fores consumidor",
    body: [
      "Se fores consumidor na UE, pode aplicar-se um direito legal de livre resolução de 14 dias ao Pro e a outros serviços pagos que nos compres à distância. Uma colaboração que acordares com outro utilizador é um contrato com esse utilizador e não connosco. Continua a aplicar-se o direito imperativo de proteção do consumidor do país onde resides.",
    ],
  },
  {
    title: "Lei e tribunais",
    body: [
      "Aplica-se o direito alemão. Se fores uma empresa, os tribunais de Berlim são competentes. Se fores consumidor, podes demandar-nos no local onde resides, e nós só te demandamos no local onde resides.",
      "Só podes compensar um crédito que não contestemos ou que um tribunal tenha decidido.",
    ],
  },
  {
    title: "Alterações",
    body: [
      "Podemos atualizar estes termos. Enviamos-te um e-mail sobre uma alteração significativa pelo menos 15 dias antes de ela se aplicar. Se não a quiseres, podes eliminar a tua conta até lá.",
    ],
  },
  ];
}

const PT_SENTRY = "A Functional Software, Inc. (Sentry), EUA, regista relatórios de erros do nosso website e da nossa app (texto do erro, página pedida, navegador) para podermos encontrar e corrigir erros (RGPD, art. 6.º, n.º 1, al. f)).";

function ptPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Quem é o responsável",
    body: [
      "O responsável pelo tratamento, na aceção do RGPD, é Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlim, Alemanha (ver Impressum). Para qualquer assunto relativo aos teus dados, escreve para info@comtor.app.",
    ],
  },
  {
    title: "A tua conta",
    body: [
      "O teu endereço de e-mail, uma palavra-passe com hash (nunca guardada em texto simples), se és uma marca ou um criador, se o teu e-mail está verificado e, se ativares a autenticação de dois fatores, o segredo usado para verificar os teus códigos. Precisamos disto para gerir a tua conta (RGPD, art. 6.º, n.º 1, al. b)). Enviamos-te e-mails para verificar o teu endereço, para repor a tua palavra-passe quando o pedires e para te avisar quando a tua palavra-passe foi alterada.",
      "Se suspendermos uma conta por violação dos nossos termos, guardamos quando e porquê, para que a decisão possa ser revista mais tarde (RGPD, art. 6.º, n.º 1, al. f)).",
      "Quando te registas, guardamos também quando aceitaste os termos e esta política de privacidade e qual era a versão, bem como o facto de teres confirmado que tens pelo menos 18 anos. Esta é a nossa prova disso (RGPD, art. 6.º, n.º 1, al. b) e f)).",
      "Os passos de configuração que viste ou concluíste ficam guardados com a tua conta, para podermos melhorar a configuração (RGPD, art. 6.º, n.º 1, al. f)).",
      "No fim da configuração perguntamos, de forma voluntária, como nos conheceste (por exemplo, um motor de pesquisa ou um amigo). Só se responderes, guardamos a opção que escolheste com a tua conta, para ver quais os canais que nos trazem pessoas (RGPD, art. 6.º, n.º 1, al. a)). Podes saltar a pergunta. A resposta é eliminada com a conta.",
      "Se chegares até nós através de uma ligação com dados de campanha (por exemplo, de um anúncio) e te registares, guardamos esses dados (origem, meio, campanha) com a tua conta, para ver que publicidade leva a registos (RGPD, art. 6.º, n.º 1, al. f)). Para isso, não definimos nenhum cookie nem usamos nenhum rastreador: os dados constam apenas do endereço da ligação e só são guardados quando te registas. Eliminamo-los com a conta.",
      "Precisamos do teu endereço de e-mail e da tua palavra-passe para celebrar e executar um contrato contigo. Sem eles não há conta. Tudo o resto que introduzires é facultativo, exceto o que é necessário para os recebimentos (a Stripe verifica a tua identidade para esse efeito).",
    ],
  },
  {
    title: "Perfis e pedidos",
    body: [
      "O que introduzes no teu perfil: para marcas, o nome da empresa, o logótipo, o website, o nicho, a descrição e as ligações sociais; para criadores, o nome de apresentação, a fotografia, o nicho, a biografia, o idioma e as plataformas com número de seguidores e ligações. Os pedidos de uma marca incluem um título, uma descrição, fotografias, o orçamento, a plataforma e o conteúdo, a data limite de publicação e os dados do produto.",
      "Os perfis e os pedidos são mostrados a outros utilizadores (é assim que funciona a correspondência) e guardados nos nossos servidores (RGPD, art. 6.º, n.º 1, al. b)).",
    ],
  },
  {
    title: "Mensagens, propostas e pagamentos",
    body: [
      "As mensagens, as propostas e as ligações que os criadores submetem para as suas publicações são guardadas e visíveis para a outra parte da conversa. Quanto aos pagamentos, guardamos o montante, a comissão, o estado e as datas; o pagamento em si é processado pela Stripe e nunca vemos os dados completos do teu cartão. As avaliações, as denúncias e os bloqueios são guardados para que essas funcionalidades funcionem (RGPD, art. 6.º, n.º 1, al. b)).",
    ],
  },
  {
    title: "E-mails que te enviamos",
    body: [
      "Os e-mails da conta (verificação, reposição da palavra-passe, palavra-passe alterada) são enviados porque tens uma conta (RGPD, art. 6.º, n.º 1, al. b)). São enviados através da Resend.",
      "As novidades ocasionais sobre o produto são separadas e facultativas. Se assinalares essa caixa ao criares uma conta, ou a ativares nas Definições, enviamos-te um e-mail com uma ligação. O consentimento é o botão nessa página, não a abertura do e-mail. Guardamos a hora em que confirmaste (RGPD, art. 6.º, n.º 1, al. a)). Podes parar de as receber nas Definições e nós paramos então. Um pedido não confirmado não é consentimento.",
      "Só enviamos e-mails promocionais a pessoas que o tenham consentido previamente (RGPD, art. 6.º, n.º 1, al. a), § 7, n.º 2, ponto 3 da UWG). Um endereço guardado numa lista não é suficiente. Guardamos o nome e o endereço de e-mail, uma nota sobre como e quando consentiste e qual a mensagem que te enviámos (registo de envios, 90 dias). Não registamos se abres um e-mail ou clicas numa ligação. Cada um destes e-mails explica-te porque o recebes e tem uma ligação para cancelar a subscrição (também como cancelamento com um clique no teu programa de correio).",
      "Podes retirar o teu consentimento a qualquer momento, com a ligação no e-mail ou escrevendo para info@comtor.app. Eliminamos então o teu endereço e o registo de envios. Guardamos apenas um hash do endereço, para não voltarmos a escrever-te por engano (RGPD, art. 6.º, n.º 1, al. c) e f)).",
    ],
  },
  {
    title: "Lista de espera",
    body: [
      "Se deixares o teu endereço de e-mail na nossa página inicial para saberes quando as apps para iOS e Android estiverem disponíveis, guardamo-lo juntamente com a indicação de teres escolhido marca ou criador e enviamos-te primeiro um e-mail com uma ligação para confirmares que o endereço é teu (double opt-in). Só depois de confirmares é que o usamos, apenas para esse único e-mail (RGPD, art. 6.º, n.º 1, al. a)); guardamos a hora em que confirmaste como prova do teu consentimento. Se não confirmares, não voltarás a ter notícias nossas e o endereço é eliminado após 30 dias. Quando as apps estiverem disponíveis e te tivermos avisado, o endereço é eliminado. Podes retirar o teu consentimento a qualquer momento escrevendo para info@comtor.app e eliminamo-lo de imediato.",
    ],
  },
  {
    title: "Segurança e registos",
    body: [
      "Cada início de sessão regista a hora, se foi bem-sucedido, o teu endereço IP e o teu navegador, para que possas ver nas Definições os teus inícios de sessão recentes e para que possamos travar abusos, como a tentativa de adivinhar palavras-passe. Quando usas a comtor, o nosso fornecedor de alojamento também trata dados técnicos (endereço IP, hora, página pedida, navegador) para a disponibilizar e a manter segura. Ambos assentam no nosso interesse legítimo num serviço seguro (RGPD, art. 6.º, n.º 1, al. f)). Eliminamos o registo de inícios de sessão após 90 dias, o endereço IP registado no momento do registo após 7 dias e os contadores de abuso após 24 horas.",
    ],
  },
  {
    title: "Cookies, armazenamento local e notificações",
    body: [
      "Só usamos cookies estritamente necessários: um que te mantém com a sessão iniciada (30 dias a partir da tua última visita), dois de curta duração para o início de sessão (proteção contra pedidos forjados e o endereço para onde voltar) e um para o idioma que escolheste (um ano). Alterar a palavra-passe termina a sessão nos teus outros dispositivos. As tuas definições de aparência e de som, se dispensaste a sugestão de instalação e se escolheste marca ou criador na nossa página inicial ficam guardadas no armazenamento local do teu navegador e nunca nos são enviadas. Não há cookies de análise nem de publicidade.",
      "Contamos quantas vezes a nossa página inicial e o início do registo são abertos, sem cookie e sem te reconhecer: por dia apenas um número por página e origem (o nome do website de referência, ou a origem e a campanha da ligação). Não guardamos o teu endereço IP, a identificação do teu navegador nem qualquer identificador teu. Isto serve para ver que publicidade e que páginas trazem visitantes (RGPD, art. 6.º, n.º 1, al. f)).",
      "Nas páginas em que configuras os recebimentos, a Stripe carrega os seus próprios scripts. Podem definir cookies ou identificadores de dispositivo próprios para prevenir fraude (ver a política de privacidade da Stripe).",
      "As notificações push só são enviadas se as ativares (RGPD, art. 6.º, n.º 1, al. a)). Num navegador, são entregues pelo respetivo serviço push (da Apple, da Google ou da Mozilla, consoante o teu navegador). Na app comtor para iPhone ou Android, guardamos um token do teu dispositivo e enviamo-las através do Apple Push Notification service ou do Firebase Cloud Messaging da Google. Podes desativá-las a qualquer momento nas Definições, no teu navegador ou nas definições do teu telemóvel. Os e-mails sobre a tua conta, como a verificação e a reposição da palavra-passe, são enviados através da Resend.",
    ],
  },
  {
    title: "Prestadores de serviços",
    body: [
      "Estes prestadores tratam dados por nossa conta e segundo as nossas instruções (RGPD, art. 28.º): a Vercel Inc., EUA, que aloja o website e a app; a Neon Inc., EUA, cuja base de dados utilizamos, alojada em Frankfurt, Alemanha; a Resend Inc., EUA, que entrega os nossos e-mails (conta, divulgação e lista de espera); e a Google Ireland Limited, que entrega as notificações push à app Android através do Firebase Cloud Messaging.",
      "Os pagamentos, os recebimentos e as verificações de identidade exigidas para os recebimentos são tratados pela Stripe. Para parte deste tratamento, a Stripe Payments Europe, Ltd. (Irlanda) é ela própria responsável. Ver a política de privacidade da Stripe.",
      "As notificações push para a app de iPhone são entregues pela Apple Inc., EUA, através do Apple Push Notification service.",
      "Quando os dados chegam aos EUA, a transferência baseia-se no Quadro de Privacidade de Dados UE-EUA (EU–U.S. Data Privacy Framework) ou nas Cláusulas Contratuais-Tipo da UE.",
    ],
  },
  {
    title: "Durante quanto tempo guardamos os dados",
    body: [
      "Guardamos os teus dados enquanto tiveres uma conta. Quando eliminas a tua conta nas Definições, o teu perfil, os teus pedidos, as tuas mensagens e tudo o que está ligado a eles são eliminados com ela.",
      "A exceção são os registos de pagamentos (montante, comissão, estado, data e identificadores da Stripe). Temos de os conservar durante o tempo exigido pela lei fiscal e comercial, de 8 a 10 anos consoante o registo (RGPD, art. 6.º, n.º 1, al. c), §§ 147 AO e 257 HGB). São anonimizados, de modo a deixarem de apontar para ti. A Stripe conserva os seus próprios registos de pagamentos conforme a lei exige.",
      "Outros prazos: registo de inícios de sessão 90 dias, endereço IP registado no momento do registo 7 dias, contadores de abuso 24 horas, registo de envios de e-mails promocionais 90 dias, endereços não confirmados da lista de espera 30 dias.",
    ],
  },
  {
    title: "Os teus direitos",
    body: [
      "Podes pedir o acesso aos teus dados (RGPD, art. 15.º), a sua retificação (art. 16.º), o apagamento (art. 17.º) ou a limitação (art. 18.º), e recebê-los num formato portátil (art. 20.º). A exportação nas Definições dá-te uma cópia a qualquer momento. Podes opor-te ao tratamento baseado em interesse legítimo (art. 21.º) e retirar qualquer consentimento para o futuro (art. 7.º, n.º 3). Basta escreveres para info@comtor.app.",
      "Tens também o direito de apresentar reclamação a uma autoridade de proteção de dados. No nosso caso, é a Comissária de Berlim para a Proteção de Dados e a Liberdade de Informação (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Sem decisões automatizadas",
    body: [
      "Os pedidos que um criador vê são determinados por regras simples (nicho, idioma do conteúdo e número de seguidores), e não por decisões automatizadas com efeitos jurídicos ou significativos de forma semelhante (RGPD, art. 22.º).",
    ],
  },
  {
    title: "Alterações",
    body: ["Atualizamos esta política quando o serviço muda; a data no topo indica a versão atual."],
  },
  ];
  // Sentry is named only where it is switched on, so the text matches what runs.
  return sentry
    ? sections.map((section) =>
        section.title === "Prestadores de serviços" ? { ...section, body: [section.body[0], PT_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const PT_LICENSES: LegalSection[] = [
  {
    title: "Software de código aberto",
    body: [
      "A comtor é construída com software de código aberto. Cada pacote tem a sua própria licença, sobretudo MIT, Apache-2.0, ISC e BSD. Os textos das licenças de tudo com que a app implementada é construída estão no ficheiro ligado abaixo.",
    ],
  },
  {
    title: "Tipos de letra",
    body: [
      "O texto é composto em Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) com o Nome de Fonte Reservado \"Lato\", sob a SIL Open Font License, Versão 1.1.",
    ],
  },
  {
    title: "Ícones e nomes de marcas",
    body: [
      "Os ícones da interface vêm da Feather e da Ionicons (ambas com licença MIT); os símbolos das plataformas sociais são da Simple Icons (CC0). Os nomes e logótipos do Instagram, TikTok, YouTube, Twitch e X pertencem aos seus titulares e são mostrados apenas para nomear a plataforma.",
    ],
  },
  {
    title: "Fotografias",
    body: [
      "As fotografias de produtos na página de apresentação são da Unsplash e usadas ao abrigo da Licença Unsplash. As marcas, os criadores e as avaliações mostrados nos exemplos são inventados.",
    ],
  },
];

export const legalPt: LegalContent = {
  htmlLang: "pt",
  notice: "Esta página é uma tradução por conveniência. Em caso de divergência, prevalece a versão alemã.",
  updated: "7 de outubro de 2026",
  ui: {
    termsTitle: "Termos de Serviço",
    termsDescription: "Os termos para utilizar a comtor.",
    privacyTitle: "Política de Privacidade",
    privacyDescription: "Que dados pessoais a comtor trata, porquê, e que direitos tens.",
    imprintTitle: "Impressum",
    imprintDescription: "Informações nos termos do § 5 DDG.",
    vatLabel: "Número de identificação fiscal (IVA)",
    licensesTitle: "Licenças de código aberto",
    licensesDescription: "Que software, tipos de letra e imagens a comtor utiliza, e sob que licenças.",
    licensesTextFile: "Textos das licenças de todos os pacotes de código aberto (ficheiro de texto)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: ptTerms,
  privacy: ptPrivacy,
  imprint: {
    lead: "Informações nos termos do § 5 DDG.",
    rows: [
      { label: "Prestador do serviço", lines: ["Teethawat Kanpai", "Empresário em nome individual (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlim, Alemanha"] },
      { label: "Contacto", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Responsável pelo conteúdo", lines: ["Teethawat Kanpai, morada como acima (§ 18, n.º 2 MStV)"] },
    ],
    disputeTitle: "Resolução de litígios de consumo",
    dispute: "Não estamos dispostos nem obrigados a participar em processos de resolução de litígios perante uma entidade de arbitragem de consumo.",
  },
  licenses: PT_LICENSES,
};
