import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

//   = espace insécable (avant %, ?, : et dans les guillemets français).
export const faqFr: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Comment fonctionnent le matching, les paiements et les avis sur comtor.",
  },
  proOffer:
    " Abonne-toi à Pro pour {price} par mois, et les frais passent à {proFee} %. Ça vaut pour chaque paiement où l’une des deux parties a Pro.",
  items: {
    matching: {
      question: "Comment fonctionne le matching ?",
      answer:
        "Les marques publient une demande avec une niche, les langues du contenu, un minimum d’abonnés et une catégorie de produit. Les créateurs choisissent jusqu’à 3 niches. Sous « Pour toi », ils voient les demandes de ces niches, si la demande est dans la langue de leur contenu et si l’une de leurs plateformes atteint le minimum d’abonnés. Sous « Tout », ils voient chaque demande qui correspond à leur langue et à leur portée. Personne ne valide les matchs à la main : une demande adaptée apparaît dans le fil.",
    },
    reachOut: {
      question: "Comment je prends contact ?",
      answer:
        "Touche « Intéressé » sur une demande qui correspond. Ça ouvre un chat où les deux parties s’écrivent directement. Les deux voient aussi l’e-mail de contact de l’autre.",
    },
    payments: {
      question: "Comment fonctionnent les paiements ?",
      answer:
        "La marque paie le créateur via comtor, jamais en direct. L’argent est retenu jusqu’à ce que le créateur publie et envoie le lien. La marque a alors {days} jours pour approuver la publication, ce qui verse l’argent aussitôt, ou pour signaler un problème. Pas de réponse après {days} jours ? L’argent est versé automatiquement. comtor garde {fee} % de chaque paiement.{proOffer}",
    },
    pro: {
      question: "C’est quoi la formule Pro ?",
      answer:
        "Un abonnement mensuel optionnel pour les marques et les créateurs ({price} par mois). Il baisse les frais de {fee} % à {proFee} % sur chaque paiement où la marque ou le créateur a Pro. Une seule des parties suffit. Pro est rentable dès qu’environ {breakEven} par mois passent par ton compte. Stripe te facture chaque mois. Gère ou annule l’abonnement dans les réglages. Les {foundingBrands} premières marques et les {foundingCreators} premiers créateurs ont Pro gratuit tant que leur compte existe.",
    },
    noPost: {
      question: "Et si le créateur ne publie jamais ?",
      answer:
        "La marque annule le paiement à tout moment avant l’envoi de la publication et récupère la totalité du montant. Si une publication est envoyée mais pose problème (absente, supprimée, non conforme), la marque signale le problème sous {days} jours. L’argent reste retenu pendant qu’on examine le cas. Ensuite, on le verse au créateur ou on rembourse la marque. Un paiement versé ne peut pas être annulé. Les avis des deux côtés montrent qui est fiable avant que tu paies.",
    },
    realMoney: {
      question: "C’est de l’argent réel ?",
      answer:
        "Oui. Les paiements des collabs et l’abonnement Pro passent par Stripe. De l’argent réel circule entre de vrais comptes bancaires.",
    },
    followers: {
      question: "Comment le nombre d’abonnés est-il vérifié ?",
      answer:
        "Les créateurs le saisissent eux-mêmes. Chaque plateforme renvoie vers le vrai compte, donc tu vérifies le chiffre réel avant de prendre contact.",
    },
    reviews: {
      question: "Puis-je laisser un avis ?",
      answer:
        "Oui. Une fois le paiement versé, chaque partie peut laisser une note et un court commentaire. Les avis s’affichent sur les profils publics et aident les autres à choisir avec qui travailler.",
    },
    contact: {
      question: "Comment vous contacter ?",
      answer: "Retrouve nos coordonnées sur la page Mentions légales.",
    },
  },
};
