import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsFr: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "Le bouton ne marche pas ? Colle ce lien dans ton navigateur :",
    stop: "Ne plus recevoir ces e-mails",
    tagline: "Les marques rencontrent les bons créateurs.",
    imprint: "Mentions légales",
    privacy: "Confidentialité",
    numberLocale: "fr-FR",
  },
  welcome: {
    subject: "Bienvenue sur comtor – confirme ton adresse e-mail",
    preview: "Merci de t’être inscrit. Un clic, et ton adresse e-mail est confirmée.",
    heading: "Bienvenue sur comtor.",
    bodyCreator: "Merci de t’être inscrit. Confirme ton adresse e-mail, puis swipe des deals de marques, avec le budget affiché sur la carte.",
    bodyBrand: "Merci de t’être inscrit. Confirme ton adresse e-mail, puis publie ta première demande. Les créateurs viennent à toi.",
    foundingCreator:
      "Tu es le créateur fondateur n° {number}. Pro est gratuit pour toi tant que ton compte existe. comtor garde {pro} % de chaque paiement au lieu de {standard} %, et tu reçois {keep} %.",
    foundingBrand:
      "Tu es la marque fondatrice n° {number}. Pro est gratuit pour toi tant que ton compte existe. comtor garde {pro} % de chaque paiement au lieu de {standard} %.",
    action: "Confirmer l’e-mail",
    note: "Le lien fonctionne 24 heures. Tu ne t’es pas inscrit sur comtor ? Alors ignore cet e-mail.",
  },
  foundingNotice: {
    subject: "Pro est gratuit pour toi, pour toujours",
    previewCreator: "Tu fais partie des premiers créateurs sur comtor.",
    previewBrand: "Tu fais partie des premières marques sur comtor.",
    heading: "Tu as Pro, pour toujours.",
    bodyCreator:
      "Tu fais partie des {limit} premiers créateurs sur comtor (créateur fondateur n° {number}). Voilà pourquoi Pro est gratuit pour toi tant que ton compte existe. comtor garde {pro} % au lieu de {standard} % de chaque paiement, et tu reçois {keep} %. Tu n’as rien à faire.",
    bodyBrand:
      "Tu fais partie des {limit} premières marques sur comtor (marque fondatrice n° {number}). Voilà pourquoi Pro est gratuit pour toi tant que ton compte existe. comtor garde {pro} % au lieu de {standard} % de chaque paiement. Tu n’as rien à faire.",
    subscription: "Ton abonnement Pro actuel continue et reste facturé. Tu peux le résilier dans les réglages et garder Pro.",
    action: "Voir ton offre",
    note: "Tu reçois cet e-mail parce que tu as un compte comtor. Il concerne ton offre et n’est pas une publicité.",
  },
  marketingWelcome: {
    note: "Tu reçois cet e-mail parce que tu as accepté d’avoir des nouvelles de comtor. Tu peux l’arrêter à tout moment avec le lien ci-dessous.",
    noteWithReason:
      "Tu reçois cet e-mail parce que tu as accepté d’avoir des nouvelles de comtor ({reason}). Tu peux l’arrêter à tout moment avec le lien ci-dessous.",
    hint: "Jette d’abord un œil. L’inscription se fait sur la page.",
    creator: {
      preview: "Gagne de l’argent en publiant sur les réseaux sociaux.",
      heading: "Gagne de l’argent en publiant sur les réseaux sociaux.",
      headingNamed: "{name}, gagne de l’argent en publiant sur les réseaux sociaux.",
      body: "Sur comtor, les marques publient un deal payé et tu swipes ceux que tu veux. Le budget est sur la carte. La marque paie avant que tu publies, et tu gardes {keep} %.",
      steps: {
        swipe: {
          title: "Swipe un deal.",
          text: "À droite, ça t’intéresse. À gauche, tu passes. La marque voit ton profil et peut t’écrire.",
        },
        budget: {
          title: "Le budget est sur la carte.",
          text: "Fini les DM sur ton tarif. Chaque demande indique la paie, quoi publier et si le produit est fourni.",
        },
        paid: {
          title: "Payé avant que tu publies.",
          text: "Tu acceptes l’offre, la marque paie d’abord. L’argent est retenu jusqu’à ta publication.",
        },
        keep: {
          title: "Tu gardes {keep} %.",
          text: "La marque a {days} jours pour valider ta publication. Sans réponse, l’argent te revient quand même. Avec Pro ({price} € par mois), tu gardes {proKeep} %.",
        },
      },
      crowdOne: "marque déjà inscrite",
      crowdMany: "marques déjà inscrites",
      action: "Voir les deals payés",
    },
    brand: {
      preview: "Fais grandir ta marque avec des créateurs de contenu.",
      heading: "Fais grandir ta marque avec des créateurs de contenu.",
      headingNamed: "{name}, fais grandir ta marque avec des créateurs de contenu.",
      body: "Sur comtor, tu publies le produit, le budget et le contenu voulu. Les créateurs qui correspondent swipent à droite et viennent à toi. Tu paies quand vous êtes d’accord. L’argent est retenu jusqu’à la mise en ligne.",
      steps: {
        post: {
          title: "Publie le produit et le budget.",
          text: "Photos, budget, plateforme et contenu. Les créateurs reçoivent une carte dans leur fil.",
        },
        come: {
          title: "Les créateurs viennent à toi.",
          text: "Les créateurs de ta niche swipent à droite. Tu vois leur audience et leurs avis, et tu choisis.",
        },
        chat: {
          title: "Mettez-vous d’accord dans le chat.",
          text: "Envoie une offre. Quand le créateur accepte, tu paies, et l’argent est retenu jusqu’à la mise en ligne.",
        },
        paidOut: {
          title: "Ensuite, c’est versé.",
          text: "Tu vérifies d’abord la publication en ligne. Pas de frais fixes : comtor garde {fee} % de chaque paiement, ou {proFee} % avec Pro ({price} € par mois).",
        },
      },
      crowdOne: "créateur déjà inscrit",
      crowdMany: "créateurs déjà inscrits",
      action: "Publier ton premier deal",
    },
  },
  verification: {
    subject: "Confirme ton adresse e-mail comtor",
    preview: "Confirme que l’adresse est la tienne. Le lien fonctionne 24 heures.",
    heading: "Confirme ton adresse e-mail.",
    body: "Confirme que cette adresse appartient à ton compte comtor.",
    action: "Confirmer l’e-mail",
    note: "Le lien fonctionne 24 heures. Tu ne t’es pas inscrit sur comtor ? Alors ignore cet e-mail.",
  },
  passwordReset: {
    subject: "Réinitialise ton mot de passe comtor",
    preview: "Choisis un nouveau mot de passe. Le lien fonctionne 1 heure.",
    heading: "Réinitialise ton mot de passe.",
    body: "Quelqu’un a demandé la réinitialisation de ton mot de passe comtor. Si c’est toi, choisis-en un nouveau.",
    action: "Choisir un nouveau mot de passe",
    note: "Le lien ne marche qu’une fois, pendant 1 heure. Un nouveau mot de passe te déconnecte partout. Tu n’as rien demandé ? Alors ignore cet e-mail, ton mot de passe ne change pas.",
  },
  passwordChanged: {
    subject: "Ton mot de passe comtor a été changé",
    preview: "Si c’était toi, tout est en ordre.",
    heading: "Ton mot de passe a été changé.",
    body: "Ton mot de passe comtor vient d’être changé, et nous avons déconnecté tes autres appareils. Si c’était toi, tout est en ordre.",
    action: "Réinitialiser le mot de passe",
    note: "Ce n’était pas toi ? Réinitialise ton mot de passe tout de suite. Cela déconnecte la personne qui l’a changé.",
  },
  accountSuspended: {
    subject: "Ton compte comtor a été suspendu",
    preview: "Voici pourquoi, et comment contester.",
    heading: "Ton compte a été suspendu.",
    body: "Nous avons suspendu ton compte comtor. Motif : {reason} Tant qu’il est suspendu, tu ne peux pas te connecter. Nous fermons les demandes ouvertes d’un compte marque.",
    action: "Contester cette décision",
    objectSubject: "Compte suspendu",
    note: "Si tu penses que c’est une erreur, réponds à cet e-mail ou écris à info@comtor.app. Nous réexaminerons le cas et te répondrons.",
  },
  test: {
    subject: "E-mail de test comtor",
    preview: "Si tu lis ceci, les e-mails de comtor fonctionnent.",
    heading: "Ça fonctionne.",
    body: "Ceci est un e-mail de test depuis l’espace admin. S’il est dans ta boîte de réception, les e-mails d’inscription, de confirmation et de mot de passe arrivent aussi.",
    action: "Ouvrir comtor",
    note: "Envoyé par un admin depuis /admin/email. Rien à faire.",
  },
  marketingConsent: {
    subject: "Confirme les nouveautés de comtor",
    preview: "Un clic, et nous pouvons t’envoyer de temps en temps des nouvelles de comtor.",
    heading: "Confirme les nouveautés produit.",
    body: "Tu as demandé à recevoir de temps en temps des e-mails sur comtor. Appuie sur le bouton de la page suivante pour confirmer. D’ici là, cette adresse ne reçoit aucune nouveauté produit.",
    action: "Vérifier et confirmer",
    note: "Tu n’as rien demandé ? Ignore cet e-mail. Rien n’est activé tant que tu n’as pas appuyé sur le bouton.",
  },
  waitlistConfirmation: {
    subject: "Confirme ta place sur la liste d’attente comtor",
    preview: "Un clic, et tu seras prévenu le jour de la sortie des apps.",
    heading: "Confirme ton adresse e-mail.",
    body: "Tu as demandé à être prévenu de la sortie des apps comtor sur iOS et Android. Confirme que cette adresse est la tienne, et tu es sur la liste.",
    action: "Confirmer l’e-mail",
    note: "Nous t’enverrons un seul e-mail, le jour de la sortie des apps. Tu ne t’es pas inscrit ? Alors ignore cet e-mail, et tu n’auras plus de nouvelles de nous.",
  },
  // A deal notice and the documents of a deal (src/lib/deals/notices.ts, billing). {number}: document number, {title}: request title, {replaces}: the cancelled document.
  dealNotice: {
    headingAction: "Ton deal a besoin de toi.",
    headingNews: "Du nouveau sur ton deal.",
    action: "Ouvrir dans comtor",
    note: "Tu reçois cet e-mail parce qu’un délai, une annulation ou de l’argent est en jeu. Ces messages ne peuvent pas être désactivés.",
  },
  dealDocument: {
    invoice: { subject: "Ta facture {number}", heading: "Ta facture est prête.", body: "La facture {number} pour « {title} » est jointe en PDF. Tu la retrouves aussi sous Deals, Factures." },
    credit: { subject: "Ton avoir {number}", heading: "Ton avoir est prêt.", body: "L’avoir {number} pour « {title} » est joint en PDF. Tu le retrouves aussi sous Deals, Factures." },
    corrected: { subject: "Document corrigé : {replaces} remplacé par {number}", heading: "Un document a été corrigé.", body: "Le document {replaces} pour « {title} » a été annulé et remplacé par {number}. L’annulation et le nouveau document sont joints en PDF." },
    action: "Ouvrir le document",
    note: "Tu reçois cet e-mail parce qu’un document a été émis pour l’un de tes deals. Conserve-le pour ta comptabilité.",
  },
};
