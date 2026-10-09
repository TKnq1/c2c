import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqPt: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Como funcionam as correspondências, os pagamentos e as avaliações na comtor.",
  },
  proOffer:
    " Subscreve o Pro por {price} por mês e a comissão desce para {proFee}%. Aplica-se a todos os pagamentos em que um dos lados tenha Pro.",
  items: {
    matching: {
      question: "Como funcionam as correspondências?",
      answer:
        "As marcas publicam um pedido com nicho, idiomas do conteúdo, mínimo de seguidores e categoria de produto. Os criadores escolhem até 3 nichos. Em «Para ti», veem os pedidos desses nichos, se o pedido estiver no idioma do seu conteúdo e uma das suas plataformas atingir o mínimo de seguidores. Em «Tudo», veem todos os pedidos que encaixam no idioma e no alcance. Ninguém aprova correspondências à mão: um pedido que encaixa aparece no feed.",
    },
    reachOut: {
      question: "Como entro em contacto?",
      answer:
        "Toca em «Interessado» num pedido que encaixa. Abre-se uma conversa onde os dois lados falam diretamente. Ambos veem também o e-mail de contacto do outro.",
    },
    payments: {
      question: "Como funcionam os pagamentos?",
      answer:
        "A marca paga o criador através da comtor, nunca diretamente. O dinheiro fica retido até o criador publicar e enviar a ligação. Depois, a marca tem {days} dias para aprovar a publicação, o que liberta o dinheiro de imediato, ou para comunicar um problema. Sem resposta após {days} dias? O dinheiro é libertado automaticamente. A comtor fica com {fee}% de cada pagamento.{proOffer}",
    },
    pro: {
      question: "O que é o plano Pro?",
      answer:
        "Uma subscrição mensal opcional para marcas e criadores ({price} por mês). Baixa a comissão de {fee}% para {proFee}% em cada pagamento em que a marca ou o criador tenha Pro. Basta um dos lados. O Pro compensa quando passam cerca de {breakEven} por mês pela tua conta. A Stripe cobra todos os meses. Gere ou cancela nas Definições. As primeiras {foundingBrands} marcas e os primeiros {foundingCreators} criadores têm o Pro grátis, enquanto a conta existir.",
    },
    noPost: {
      question: "E se o criador nunca publicar?",
      answer:
        "A marca cancela o pagamento em qualquer altura antes de o criador enviar a publicação e recebe o valor total de volta. Se a publicação for enviada mas algo estiver errado (em falta, removida, diferente do combinado), a marca comunica o problema em {days} dias. O dinheiro continua retido enquanto analisamos o caso. Depois, libertamo-lo ao criador ou reembolsamos a marca. Um pagamento libertado não pode ser revertido. As avaliações dos dois lados mostram quem é de confiança antes de pagares.",
    },
    realMoney: {
      question: "É dinheiro a sério?",
      answer: "Sim. Os pagamentos das colaborações e a subscrição Pro passam pela Stripe. Dinheiro real circula entre contas bancárias reais.",
    },
    followers: {
      question: "Como se verificam os seguidores?",
      answer:
        "Os criadores indicam o número eles próprios. Cada plataforma tem a ligação para a conta real, por isso confirmas o número verdadeiro antes de entrares em contacto.",
    },
    reviews: {
      question: "Posso deixar uma avaliação?",
      answer:
        "Sim. Depois de um pagamento ser libertado, cada lado pode deixar uma classificação e um comentário curto. As avaliações aparecem nos perfis públicos e ajudam os outros a escolher com quem trabalhar.",
    },
    contact: {
      question: "Como falo convosco?",
      answer: "Os nossos contactos estão na página de Informação legal.",
    },
  },
};
