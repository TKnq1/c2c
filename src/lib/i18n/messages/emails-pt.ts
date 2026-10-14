import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsPt: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "O botão não funciona? Cola esta ligação no teu navegador:",
    stop: "Deixar de receber estes e-mails",
    tagline: "As marcas encontram os criadores certos.",
    imprint: "Informação legal",
    privacy: "Privacidade",
    numberLocale: "pt-PT",
  },
  welcome: {
    subject: "Bem-vindo à comtor – confirma o teu e-mail",
    preview: "Obrigado por te registares. Um toque e o teu e-mail fica confirmado.",
    heading: "Bem-vindo à comtor.",
    bodyCreator: "Obrigado por te registares. Confirma o teu e-mail e desliza por deals de marcas, com o orçamento à vista no cartão.",
    bodyBrand: "Obrigado por te registares. Confirma o teu e-mail e publica o teu primeiro pedido. Os criadores vêm ter contigo.",
    foundingCreator:
      "Tens o lugar n.º {number} de criador fundador. O Pro é grátis para ti enquanto a tua conta existir. A comtor fica com {pro}% de cada pagamento, em vez de {standard}%, e tu ficas com {keep}%.",
    foundingBrand:
      "Tens o lugar n.º {number} de marca fundadora. O Pro é grátis para ti enquanto a tua conta existir. A comtor fica com {pro}% de cada pagamento, em vez de {standard}%.",
    action: "Confirmar e-mail",
    note: "A ligação funciona durante 24 horas. Não te registaste na comtor? Então podes ignorar este e-mail.",
  },
  foundingNotice: {
    subject: "O Pro é grátis para ti, para sempre",
    previewCreator: "És um dos primeiros criadores da comtor.",
    previewBrand: "És uma das primeiras marcas da comtor.",
    heading: "Tens o Pro, para sempre.",
    bodyCreator:
      "És um dos primeiros {limit} criadores da comtor (criador fundador n.º {number}). Por isso, o Pro é grátis para ti enquanto a tua conta existir. A comtor fica com {pro}% de cada pagamento, em vez de {standard}%, e tu ficas com {keep}%. Não tens de fazer nada.",
    bodyBrand:
      "És uma das primeiras {limit} marcas da comtor (marca fundadora n.º {number}). Por isso, o Pro é grátis para ti enquanto a tua conta existir. A comtor fica com {pro}% de cada pagamento, em vez de {standard}%. Não tens de fazer nada.",
    subscription: "A tua subscrição Pro anterior continua ativa e a ser cobrada. Podes cancelá-la nas Definições e manter o Pro.",
    action: "Ver o teu plano",
    note: "Recebes este e-mail porque tens uma conta comtor. Fala do teu plano e não é publicidade.",
  },
  marketingWelcome: {
    note: "Recebes este e-mail porque aceitaste receber notícias da comtor. Podes deixar de os receber a qualquer momento com a ligação abaixo.",
    noteWithReason:
      "Recebes este e-mail porque aceitaste receber notícias da comtor ({reason}). Podes deixar de os receber a qualquer momento com a ligação abaixo.",
    hint: "Começa por espreitar. O registo está na página.",
    creator: {
      preview: "Ganha dinheiro a publicar nas redes sociais.",
      heading: "Ganha dinheiro a publicar nas redes sociais.",
      headingNamed: "{name}, ganha dinheiro a publicar nas redes sociais.",
      body: "Na comtor, as marcas publicam deals pagos e tu deslizas os que queres. O orçamento está no cartão. A marca paga antes de publicares e tu ficas com {keep}%.",
      steps: {
        swipe: {
          title: "Desliza um deal.",
          text: "Direita é que o queres, esquerda é que passas. A marca vê o teu perfil e pode escrever-te.",
        },
        budget: {
          title: "O orçamento está no cartão.",
          text: "Chega de DMs sobre o teu preço. Cada pedido diz quanto paga, o que publicar e se o produto está incluído.",
        },
        paid: {
          title: "Pago antes de publicares.",
          text: "Aceitas a oferta e a marca paga primeiro. O dinheiro fica retido até a tua publicação estar no ar.",
        },
        keep: {
          title: "Ficas com {keep}%.",
          text: "A marca tem {days} dias para aprovar a tua publicação. Se não responder, o dinheiro vai para ti na mesma. Com o Pro ({price} € por mês), ficas com {proKeep}%.",
        },
      },
      crowdOne: "marca já está cá",
      crowdMany: "marcas já estão cá",
      action: "Ver deals pagos",
    },
    brand: {
      preview: "Faz crescer a tua marca com criadores de conteúdo.",
      heading: "Faz crescer a tua marca com criadores de conteúdo.",
      headingNamed: "{name}, faz crescer a tua marca com criadores de conteúdo.",
      body: "Na comtor, publicas o produto, o orçamento e o que criar. Os criadores certos deslizam para a direita e vêm ter contigo. Pagas quando chegam a acordo. O dinheiro fica retido até a publicação estar no ar.",
      steps: {
        post: {
          title: "Publica o produto e o orçamento.",
          text: "Fotos, orçamento, plataforma e o que publicar. Os criadores recebem um cartão no feed.",
        },
        come: {
          title: "Os criadores vêm ter contigo.",
          text: "Criadores do teu nicho deslizam para a direita. Vês o alcance e as avaliações e escolhes quem encaixa.",
        },
        chat: {
          title: "Combinem tudo na conversa.",
          text: "Envia uma oferta. Quando o criador aceita, pagas, e o dinheiro fica retido até a publicação estar no ar.",
        },
        paidOut: {
          title: "Depois é pago.",
          text: "Primeiro verificas a publicação no ar. Sem mensalidade: a comtor fica com {fee}% de cada pagamento, ou {proFee}% com o Pro ({price} € por mês).",
        },
      },
      crowdOne: "criador já está cá",
      crowdMany: "criadores já estão cá",
      action: "Publicar o primeiro deal",
    },
  },
  verification: {
    subject: "Confirma o teu e-mail da comtor",
    preview: "Confirma que o endereço é teu. A ligação funciona durante 24 horas.",
    heading: "Confirma o teu e-mail.",
    body: "Confirma que este endereço pertence à tua conta comtor.",
    action: "Confirmar e-mail",
    note: "A ligação funciona durante 24 horas. Não te registaste na comtor? Então podes ignorar este e-mail.",
  },
  passwordReset: {
    subject: "Repõe a tua palavra-passe da comtor",
    preview: "Escolhe uma nova palavra-passe. A ligação funciona durante 1 hora.",
    heading: "Repõe a tua palavra-passe.",
    body: "Alguém pediu para repor a tua palavra-passe da comtor. Se foste tu, escolhe uma nova.",
    action: "Escolher nova palavra-passe",
    note: "A ligação funciona uma só vez, durante 1 hora. Com uma nova palavra-passe, a tua sessão termina em todo o lado. Não pediste isto? Então ignora este e-mail e a tua palavra-passe mantém-se.",
  },
  passwordChanged: {
    subject: "A tua palavra-passe da comtor foi alterada",
    preview: "Se foste tu, está tudo certo.",
    heading: "A tua palavra-passe foi alterada.",
    body: "A tua palavra-passe da comtor acabou de ser alterada e terminámos a sessão nos teus outros dispositivos. Se foste tu, está tudo certo.",
    action: "Repor palavra-passe",
    note: "Não foste tu? Repõe a palavra-passe já. Isso termina a sessão de quem a alterou.",
  },
  accountSuspended: {
    subject: "A tua conta comtor foi suspensa",
    preview: "Aqui está o motivo e como contestar.",
    heading: "A tua conta foi suspensa.",
    body: "Suspendemos a tua conta comtor. Motivo: {reason} Enquanto estiver suspensa, não podes iniciar sessão. Fechamos os pedidos em aberto de uma conta de marca.",
    action: "Contestar esta decisão",
    objectSubject: "Conta suspensa",
    note: "Se achas que foi um engano, responde a este e-mail ou escreve para info@comtor.app. Vamos analisar de novo e responder-te.",
  },
  test: {
    subject: "E-mail de teste da comtor",
    preview: "Se consegues ler isto, os e-mails da comtor funcionam.",
    heading: "Funciona.",
    body: "Este é um e-mail de teste da área de administração. Se está na tua caixa de entrada, os e-mails de registo, confirmação e palavra-passe também chegam às pessoas.",
    action: "Abrir a comtor",
    note: "Enviado por um administrador a partir de /admin/email. Não tens de fazer nada.",
  },
  marketingConsent: {
    subject: "Confirma as novidades da comtor",
    preview: "Um botão e podemos enviar-te novidades ocasionais sobre a comtor.",
    heading: "Confirma as novidades do produto.",
    body: "Pediste e-mails ocasionais sobre a comtor. Carrega no botão da página seguinte para confirmar. Até lá, este endereço não recebe novidades do produto.",
    action: "Rever e confirmar",
    note: "Não pediste isto? Ignora o e-mail. Nada fica ativado até carregares no botão.",
  },
  waitlistConfirmation: {
    subject: "Confirma o teu lugar na lista de espera da comtor",
    preview: "Um toque e avisamos-te no dia em que as apps saírem.",
    heading: "Confirma o teu e-mail.",
    body: "Pediste para saber quando as apps da comtor saem para iOS e Android. Confirma que este endereço é teu e ficas na lista.",
    action: "Confirmar e-mail",
    note: "Enviamos-te um único e-mail, no dia em que as apps saírem. Não te registaste? Então ignora este e-mail e não voltas a ouvir falar de nós.",
  },
};
