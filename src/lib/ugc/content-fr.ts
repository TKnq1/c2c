import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcContent, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// French UGC search landing pages. Same structure as the German source (src/lib/seo-pages.ts and
// src/lib/ugc/content-de.ts): slugs and niche keys stay identical, the texts are written freely in French.
// No invented numbers or quotes, and no "escrow" wording on public pages (see docs/legal-readiness.md).

const NBSP = "\u00A0";
const FEE = `${PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_PRICE = `${PRO_SUBSCRIPTION_PRICE_CENTS / 100}${NBSP}€`;

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} et ${PLATFORMS[PLATFORMS.length - 1]}`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "Comment se passe le paiement ?",
      answer: `La marque paie via la plateforme, pas directement au créateur. L’argent est retenu jusqu’à ce que le créateur publie le post et envoie le lien, et que la marque valide le post. La marque a ${RELEASE_REVIEW_DAYS} jours pour le faire et peut signaler un problème pendant ce délai. Si elle ne répond pas, le paiement est libéré automatiquement. Les paiements passent par Stripe.`,
    },
    {
      question: "Combien coûte comtor ?",
      answer: `L’inscription est gratuite et il n’y a pas d’abonnement obligatoire. comtor retient ${FEE} de chaque paiement. La commission est déduite du versement du créateur. La marque paie exactement le montant convenu. Marques et créateurs peuvent souscrire un abonnement Pro optionnel à ${PRO_PRICE} par mois. La commission passe alors à ${PRO_FEE} sur chaque paiement dont l’une des deux parties a Pro.`,
    },
    {
      question: "Faut-il signaler les posts payants comme publicité ?",
      answer:
        "En Allemagne, les posts payants doivent en général être signalés comme publicité. Réglez la mention dans le chat avant de publier. Ceci ne constitue pas un conseil juridique.",
    },
    {
      question: "Comment vérifiez-vous le nombre d’abonnés ?",
      answer:
        "Les créateurs indiquent eux-mêmes leurs chiffres. Chaque plateforme renseignée renvoie vers le vrai compte. Les marques vérifient donc le nombre elles-mêmes avant le premier message. Dans sa demande, la marque fixe un minimum d’abonnés. Seuls les créateurs adaptés voient la demande.",
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
      question: `Comment trouver des créateurs adaptés quand on est une ${opts.brandWho} ?`,
      answer: `Tu publies une demande : niche ${opts.label}, langue des contenus, nombre minimum d’abonnés, catégorie de produit${hint}, budget, plateforme et livrables. Les créateurs qui ont choisi ${opts.label} comme niche et qui correspondent à la langue et à la portée la voient dans leur fil. S’ils sont intéressés, ils t’écrivent dans le chat. comtor ne vérifie pas les demandes à la main.`,
    },
    {
      question: `Où trouver des missions ${opts.creatorFrom} quand on est créateur ?`,
      answer: `Tu crées ton profil, tu choisis jusqu’à trois niches, par exemple ${opts.label}, et tu ajoutes chaque plateforme avec son nombre d’abonnés. Dans le fil, « Pour toi » montre les demandes de tes niches. « Tout » montre tout ce qui correspond à ta langue et à ta portée, avec le budget et les exigences. Un tap sur « Intéressé » ouvre le chat avec la marque.`,
    },
  ];
}

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Beauté",
    title: "Trouver des créateurs UGC pour les marques de beauté",
    description:
      "Les marques de beauté trouvent des créateurs UGC pour des vidéos de routine, des unboxings et des photos produit. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques de beauté",
    ogLines: ["Trouver des créateurs UGC", "pour les marques de beauté."],
    lead: "Soin de la peau, maquillage, soin des cheveux, parfums : avant d’acheter un produit beauté, on veut le voir sur de vraies personnes. comtor met en relation les marques de beauté et des créateurs qui font ces vidéos et ces photos. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Vidéo de routine",
        text: "Une routine du matin ou du soir où le produit apparaît étape par étape. Marche en organique comme en pub.",
      },
      {
        title: "Unboxing et premières impressions",
        text: "Déballer, essayer, dire honnêtement ce qui frappe. Idéal pour les nouveautés et les coffrets.",
      },
      {
        title: "Application en détail",
        text: "Comment s’applique le produit, quelle sensation, quelle tenue ? Des gros plans, pas un look studio.",
      },
      {
        title: "Photos du quotidien",
        text: "Photos produit dans la salle de bain, à la coiffeuse ou en déplacement, pour la boutique, les réseaux et les pubs.",
      },
    ],
    faqs: [
      {
        question: "Comment trouver des créateurs adaptés quand on est une marque de beauté ?",
        answer:
          "Tu publies une demande : niche Beauté, langue des contenus, nombre minimum d’abonnés, catégorie de produit, budget, plateforme et livrables. Les créateurs qui ont choisi Beauté comme niche et qui correspondent à la langue et à la portée la voient dans leur fil. Ceux qui sont intéressés t’écrivent dans le chat. comtor ne vérifie pas les demandes à la main.",
      },
      {
        question: "Où trouver des missions de marques de beauté quand on est créateur ?",
        answer:
          "Tu crées ton profil, tu choisis jusqu’à trois niches, par exemple Beauté, et tu ajoutes chaque plateforme avec son nombre d’abonnés. Dans le fil, « Pour toi » montre les demandes de tes niches. « Tout » montre tout ce qui correspond à ta langue et à ta portée, avec le budget et les exigences. Un tap sur « Intéressé » ouvre le chat avec la marque.",
      },
      {
        question: "Est-ce que je reçois le produit gratuitement ?",
        answer:
          "C’est la marque qui le décide dans sa demande : elle indique si le produit est inclus. Vous réglez le reste dans le chat avant de commencer, par exemple les livrables et la date.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "Trouver des créateurs UGC pour les marques de fitness",
    description:
      "Les marques de fitness trouvent des créateurs UGC pour des vidéos d’entraînement, des tests produit et des démos d’app. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques de fitness",
    ogLines: ["Trouver des créateurs UGC", "pour les marques de fitness."],
    lead: "Vêtements de sport, équipement, compléments, apps de fitness : en fitness, on croit ce que les gens utilisent vraiment. comtor met en relation les marques de fitness et des créateurs qui montrent l’entraînement et le quotidien de façon crédible. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Entraînement avec le produit",
        text: "Une séance où l’on voit vêtements, équipement ou accessoires en situation.",
      },
      {
        title: "Test produit après quelques semaines",
        text: "Un bilan honnête : coupe, durabilité, prise en main. Aide les acheteurs à décider.",
      },
      {
        title: "Quotidien et routine",
        text: "Programme d’entraînement, meal prep ou routine du matin, avec le produit comme partie naturelle de la journée.",
      },
      {
        title: "Démo d’app et de tracker",
        text: "Capture d’écran commentée : comment se passe un entraînement avec l’app, que montre le tracker ?",
      },
    ],
    faqs: [
      {
        question: "Comment trouver des créateurs adaptés quand on est une marque de fitness ?",
        answer:
          "Tu publies une demande : niche Fitness, langue des contenus, nombre minimum d’abonnés, catégorie de produit (par exemple vêtements de sport, compléments ou app), budget, plateforme et livrables. Les créateurs qui ont choisi Fitness comme niche et qui correspondent à la langue et à la portée la voient dans leur fil. S’ils sont intéressés, ils t’écrivent dans le chat.",
      },
      {
        question: "Où trouver des missions de marques de fitness quand on est créateur ?",
        answer:
          "Tu crées ton profil, tu choisis jusqu’à trois niches, par exemple Fitness, et tu ajoutes chaque plateforme avec son nombre d’abonnés. Dans le fil, « Pour toi » montre les demandes de tes niches. « Tout » montre tout ce qui correspond à ta langue et à ta portée. Avec « Intéressé », tu ouvres le chat.",
      },
      {
        question: "Que dit la règle pour les compléments et les allégations ?",
        answer:
          "Des règles strictes encadrent les affirmations sur la santé et les effets. Pour les compléments alimentaires, convenez dans le chat de ce qu’on peut dire ou non avant le tournage. Ceci ne constitue pas un conseil juridique.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Cuisine",
    title: "Trouver des créateurs UGC pour les marques food",
    description:
      "Les marques food trouvent des créateurs UGC pour des vidéos de recettes, des dégustations et des photos culinaires. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques food",
    ogLines: ["Trouver des créateurs UGC", "pour les marques food."],
    lead: "Snacks, boissons, épices, box cuisine, ingrédients de pâtisserie : en food, on veut goûter tout de suite. comtor met en relation les marques food et des créateurs qui cuisinent, goûtent et montrent. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Vidéo de recette",
        text: "Un plat ou une boisson étape par étape, avec le produit comme ingrédient. Montre comment l’utiliser.",
      },
      {
        title: "Dégustation et premières impressions",
        text: "Goûter et décrire honnêtement ce qui frappe. Convient aux nouveautés, aux saveurs et aux coffrets cadeaux.",
      },
      {
        title: "Unboxing de box cuisine",
        text: "Déballer et présenter une box cuisine, un coffret découverte ou un coffret cadeau.",
      },
      {
        title: "Quotidien et meal prep",
        text: "Petit-déjeuner, batch cooking de la semaine ou snack entre deux : le produit fait partie du quotidien.",
      },
      {
        title: "Photos culinaires",
        text: "Plats et produits photographiés pour la boutique, les réseaux et les pubs.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Cuisine",
        brandWho: "marque food",
        creatorFrom: "de marques food",
        categories: "par exemple alimentation et boissons",
      }),
      {
        question: "Qui s’occupe de l’envoi des produits ?",
        answer:
          "Vous le réglez avant dans le chat. La demande indique seulement si le produit est inclus. Vous convenez ensemble du mode et de la date d’envoi, surtout pour les produits frais ou périssables.",
      },
      {
        question: "Que dit la règle pour les allégations santé ?",
        answer:
          "Des mentions comme « sain » ou « renforce le système immunitaire » sont strictement encadrées pour les aliments. Convenez dans le chat de ce qu’on peut dire. Ceci ne constitue pas un conseil juridique.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Mode",
    title: "Trouver des créateurs UGC pour les marques de mode",
    description:
      "Les marques de mode trouvent des créateurs UGC pour des vidéos de tenues, des essayages et des photos de style. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques de mode",
    ogLines: ["Trouver des créateurs UGC", "pour les marques de mode."],
    lead: "Vêtements, chaussures, accessoires, bijoux : on achète de la mode parce qu’on peut s’y voir. comtor met en relation les marques de mode et des créateurs qui portent les pièces, les associent et montrent comment elles tombent au quotidien. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Vidéo de tenue",
        text: "Une pièce, plusieurs looks : comment l’associer pour le travail, les loisirs et la soirée.",
      },
      {
        title: "Essayage avec avis honnête",
        text: "Coupe, matière et taille par rapport au guide des tailles, dans tes propres mots.",
      },
      {
        title: "Haul et unboxing",
        text: "Déballer la commande et présenter les pièces une par une.",
      },
      {
        title: "Photos de style au quotidien",
        text: "Des looks dans la rue, au café ou à la maison, pour la boutique, les réseaux et les pubs.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Mode",
        brandWho: "marque de mode",
        creatorFrom: "de marques de mode",
      }),
      {
        question: "Et pour la taille et la coupe ?",
        answer:
          "Vous réglez la taille avant dans le chat, pour que la pièce aille bien et que le post soit réussi. La demande de la marque indique si le produit est inclus.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tech",
    title: "Trouver des créateurs UGC pour les marques tech",
    description:
      "Les marques tech trouvent des créateurs UGC pour des unboxings, des tests au quotidien et des démos d’app. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques tech",
    ogLines: ["Trouver des créateurs UGC", "pour les marques tech."],
    lead: "Gadgets, accessoires, maison connectée, logiciels et apps : en tech, les acheteurs veulent voir comment un produit marche au quotidien. comtor met en relation les marques tech et des créateurs qui déballent, installent et expliquent. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Unboxing et installation",
        text: "Déballer, allumer, configurer : les premières minutes avec le produit, comme les vivent les acheteurs.",
      },
      {
        title: "Test au quotidien",
        text: "Une semaine avec le produit : ce qui marche, ce qui agace, pour qui il vaut le coup.",
      },
      {
        title: "Démo de fonctionnalité",
        text: "Capture d’écran ou gros plan avec l’explication d’une fonction qu’on rate souvent.",
      },
      {
        title: "Tuto pratique",
        text: "Un court tutoriel : comment résoudre un problème courant avec le produit ?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tech",
        brandWho: "marque tech",
        creatorFrom: "de marques tech",
        categories: "par exemple électronique ou logiciel/app",
      }),
      {
        question: "Comment accéder aux appareils ou aux logiciels en tant que créateur ?",
        answer:
          "Pour les appareils, la marque indique dans sa demande si le produit est inclus. Pour les logiciels et les apps, vous convenez dans le chat de la façon dont tu accèdes à un compte test ou à une version complète.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Voyage",
    title: "Trouver des créateurs UGC pour les acteurs du voyage",
    description:
      "Hôtels, voyagistes et marques de voyage trouvent des créateurs UGC pour des Reels de voyage, des visites de logements et des photos. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les acteurs du voyage",
    ogLines: ["Trouver des créateurs UGC", "pour les acteurs du voyage."],
    lead: "Hôtels, locations de vacances, voyagistes, bagagerie et apps de voyage : on réserve un voyage d’après les images et les avis des autres. comtor met en relation les acteurs du voyage et des créateurs qui montrent lieux et logements tels qu’on les vit sur place. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Reel de voyage",
        text: "Un lieu en 30 secondes : l’arrivée, les meilleurs moments, un conseil à retenir.",
      },
      {
        title: "Visite du logement",
        text: "Chambre, vue, petit-déjeuner, détails : à quoi ça ressemble vraiment et quelle impression ça donne.",
      },
      {
        title: "Trois conseils sur place",
        text: "Un format court avec des lieux préférés, des adresses où manger et des chemins hors des sentiers battus.",
      },
      {
        title: "Liste de valise et accessoires de voyage",
        text: "Valise, sac à dos, adaptateur : des produits utilisés en voyage, pour de vrai.",
      },
      {
        title: "Série photo",
        text: "Des images du lieu et du logement, pour le site, les réseaux et les pubs.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Voyage",
        brandWho: "marque du voyage",
        creatorFrom: "dans le voyage",
      }),
      {
        question: "Qui paie le trajet et le logement ?",
        answer:
          "Vous le réglez avant dans le chat et vous le notez. La demande indique le budget pour le post. Vous convenez clairement de ce qui s’ajoute : voyage, logement ou prestations sur place.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Jeux",
    title: "Trouver des créateurs UGC pour les marques de gaming",
    description:
      "Les marques de gaming trouvent des créateurs UGC pour des clips de gameplay, des tests de matériel et des premières impressions. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques de gaming",
    ogLines: ["Trouver des créateurs UGC", "pour les marques de gaming."],
    lead: "Jeux, consoles, matériel PC, accessoires et apps de jeu : les joueurs font confiance à ceux qui jouent vraiment. comtor met en relation les marques de gaming et des créateurs qui jouent, testent et commentent. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Clip de gameplay",
        text: "Une scène du jeu avec commentaire : qu’est-ce qui le rend spécial, qu’est-ce qui frappe ?",
      },
      {
        title: "Premières impressions",
        text: "Les premières heures dans un nouveau jeu, en toute franchise et sans script.",
      },
      {
        title: "Test de matériel",
        text: "Souris, casque, clavier ou manette en action : sensation, qualité, usage au quotidien.",
      },
      {
        title: "Temps forts d’un stream ou d’une session",
        text: "Les meilleurs moments d’un stream ou d’une partie, montés court.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Jeux",
        brandWho: "marque de gaming",
        creatorFrom: "de marques de gaming",
      }),
      {
        question: "Sur quelles plateformes puis-je publier ?",
        answer: `Les créateurs ajoutent chaque plateforme avec son nombre d’abonnés : ${PLATFORM_LIST}. La marque indique dans sa demande où publier.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Lifestyle",
    title: "Trouver des créateurs UGC pour les marques lifestyle",
    description:
      "Les marques lifestyle trouvent des créateurs UGC pour des vidéos du quotidien, des intérieurs et des photos produit. Les créateurs trouvent des missions payées. Inscription gratuite.",
    heading: "Trouver des créateurs UGC pour les marques lifestyle",
    ogLines: ["Trouver des créateurs UGC", "pour les marques lifestyle."],
    lead: "Habitat, maison, organisation, bien-être, accessoires : un produit lifestyle convainc quand on le voit dans la vraie vie. comtor met en relation les marques lifestyle et des créateurs qui montrent leur quotidien. Les créateurs y trouvent des missions payées dans leur niche.",
    formats: [
      {
        title: "Une journée avec le produit",
        text: "Du matin au soir : où le produit apparaît dans le quotidien et ce qu’il simplifie.",
      },
      {
        title: "Intérieur",
        text: "Un logement, un coin ou une étagère aménagés avec le produit. Montre l’effet dans un vrai intérieur.",
      },
      {
        title: "Unboxing et montage",
        text: "Déballer, monter, essayer, avec les petits pièges inclus.",
      },
      {
        title: "Routine et habitudes",
        text: "Routine du matin, du soir ou du dimanche, avec le produit placé naturellement.",
      },
      {
        title: "Photos du quotidien",
        text: "Photos produit en situation réelle, pour la boutique, les réseaux et les pubs.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Lifestyle",
        brandWho: "marque lifestyle",
        creatorFrom: "de marques lifestyle",
      }),
      {
        question: "Et si mon contenu mélange plusieurs thèmes ?",
        answer:
          "Tu peux choisir jusqu’à trois niches, par exemple Lifestyle, Mode et Cuisine. Dans le fil, « Pour toi » montre d’abord les demandes de ces niches. « Tout » montre tout ce qui correspond à ta langue et à ta portée.",
      },
      ...sharedFaqs(),
    ],
  },
];

export const ugcContentFr: UgcContent = {
  htmlLang: "fr",
  ogLocale: "fr_FR",
  ui: {
    hubTitle: "Trouver et engager des créateurs UGC",
    hubDescription:
      "Les marques trouvent des créateurs UGC pour des vidéos et des photos, les créateurs des missions payées. Publie une demande, discute dans le chat, paie via la plateforme. Gratuit.",
    hubIntro:
      "Les marques ont besoin de vidéos et de photos de vraies personnes. Les créateurs veulent être payés pour ça. comtor réunit les deux : la marque publie une demande, les créateurs adaptés se manifestent, le paiement passe par la plateforme.",
    signupNote: "Inscription gratuite. comtor fonctionne dans le navigateur, tu choisis la langue au démarrage.",
    creatorCardTitle: "Tu es créateur ?",
    creatorCardBody:
      "Voici comment trouver des missions UGC payées et être payé via la plateforme : gagner de l’argent en tant que créateur UGC.",
    byNicheTitle: "L’UGC par niche",
    howTitle: "Comment fonctionne comtor",
    forBrands: "Pour les marques",
    forCreators: "Pour les créateurs",
    hubBrandSteps: [
      "Publie une demande : niche, langue, nombre minimum d’abonnés, catégorie de produit, budget et livrables.",
      "Les créateurs se manifestent : ceux qui correspondent voient la demande dans le fil et t’écrivent dans le chat.",
      "Paie et valide : tu paies via la plateforme et tu valides le post quand il te convient.",
    ],
    hubCreatorSteps: [
      "Crée ton profil : jusqu’à trois niches et tes plateformes avec leur nombre d’abonnés.",
      "Regarde les demandes : dans le fil, tu vois le budget et les exigences avant de te manifester.",
      "Publie et sois payé : après le post, tu envoies le lien. Dès que la marque le valide (au plus tard après {days} jours), le paiement est versé.",
    ],
    faqTitle: "Questions fréquentes",
    formatsTitle: "Ces formats marchent dans la niche « {label} »",
    nicheBrandSteps: [
      "Publie une demande : niche {label}, langue, nombre minimum d’abonnés, budget et livrables.",
      "Les créateurs se manifestent : ceux qui correspondent voient la demande dans le fil et t’écrivent dans le chat.",
      "Paie et valide : tu paies via la plateforme et tu valides le post quand il te convient.",
    ],
    nicheCreatorSteps: [
      "Crée ton profil : jusqu’à trois niches, par exemple {label}, et tes plateformes avec leur nombre d’abonnés.",
      "Regarde les demandes : dans le fil, tu vois le budget et les exigences avant de te manifester.",
      "Publie et sois payé : après le post, tu envoies le lien. Dès que la marque le valide (au plus tard après {days} jours), le paiement est versé.",
    ],
    nicheReadyTitle: "Prêt pour ta première mission dans la niche « {label} » ?",
    overviewLead: "Ce qu’est l’UGC et comment fonctionne comtor, on l’explique en bref :",
    overviewLink: "Trouver des créateurs UGC",
    creatorCrumb: "Devenir créateur",
    creatorFooterLink: "Devenir créateur",
    creatorDoingTitle: "Ce que font les créateurs UGC",
    creatorStartTitle: "Comment démarrer sur comtor",
    creatorTipsTitle: "Conseils pour de bons contenus UGC",
    creatorReadyTitle: "Prêt pour ta première mission payée ?",
    creatorBrandHint: "Tu cherches des créateurs pour ta marque ? Ce qu’est l’UGC et comment fonctionne comtor, on l’explique en bref :",
    nicheNavLabel: "L’UGC par niche",
  },
  niches,
  hubFaqs: [
    {
      question: "Qu’est-ce que l’UGC ?",
      answer:
        "UGC signifie User Generated Content, soit contenu généré par les utilisateurs. En marketing, ce sont des vidéos et des photos que de vraies personnes créent pour une marque : essayer le produit, filmer, montrer. La marque les utilise sur ses canaux, dans sa boutique ou dans ses pubs. Ce qui compte, c’est le contenu, pas la portée du créateur.",
    },
    {
      question: "Quelle différence avec le marketing d’influence ?",
      answer:
        "En marketing d’influence, la portée d’une personne passe au premier plan : le post paraît sur sa chaîne. En UGC, le contenu passe au premier plan, et de plus petits créateurs peuvent aussi livrer de bonnes vidéos. Sur comtor, la marque indique dans sa demande la plateforme et le nombre minimum d’abonnés qu’elle veut, et elle peut laisser les deux ouverts.",
    },
    {
      question: "Comment trouver des créateurs UGC pour ma marque ?",
      answer:
        "Tu crées gratuitement un profil de marque et tu publies une demande : niche, langue, catégorie de produit, budget et livrables. Les créateurs adaptés la voient dans leur fil et t’écrivent dans le chat.",
    },
    ...sharedFaqs(),
  ],
  creator: {
    title: "Gagner de l’argent en tant que créateur UGC",
    description:
      "Trouve des missions payées de marques en tant que créateur UGC : regarde les demandes avec budget, discute dans le chat, sois payé via la plateforme. Gratuit.",
    heading: "Gagner de l’argent en tant que créateur UGC",
    ogLines: ["Gagner de l’argent", "en tant que créateur UGC."],
    lead: "Les créateurs UGC font des vidéos et des photos pour des marques, comme le ferait un vrai client qui montre un produit. Sur comtor, tu vois des demandes payées avec budget et exigences. Tu montres ton intérêt d’un tap et tu règles le reste dans le chat. Tu es payé via la plateforme.",
    doing: [
      {
        title: "Vidéos produit",
        text: "Essayer un produit, le filmer et montrer honnêtement comment il marche au quotidien.",
      },
      {
        title: "Unboxings et premières impressions",
        text: "Déballer, essayer, dire ce qui frappe. Sans studio, mais crédible.",
      },
      {
        title: "Démos et tutoriels",
        text: "Montrer étape par étape comment utiliser un produit et ce qu’il simplifie.",
      },
      {
        title: "Photos en situation réelle",
        text: "Photos produit du quotidien, pour la boutique, les réseaux et les pubs de la marque.",
      },
    ],
    steps: [
      "Crée ton profil : choisis jusqu’à trois niches, ajoute chaque plateforme avec son nombre d’abonnés et indique la langue de tes contenus.",
      "Regarde les demandes : dans le fil, tu vois le budget, la plateforme et les livrables avant de te manifester.",
      "Montre ton intérêt : avec « Intéressé », tu ouvres le chat avec la marque et vous réglez les détails et la date.",
      "Publie et envoie le lien : après le post, tu envoies le lien vers ton post.",
      `Sois payé : la marque valide le post, au plus tard après ${RELEASE_REVIEW_DAYS} jours, et le paiement t’est versé.`,
    ],
    tips: [
      {
        title: "Montre le produit tout de suite",
        text: "Dans les premières secondes, on doit comprendre de quoi il s’agit et ce que le produit sait faire.",
      },
      {
        title: "Parle naturellement",
        text: "Des impressions honnêtes dans tes propres mots convainquent en général plus qu’un texte appris par cœur.",
      },
      {
        title: "Soigne la lumière et le son",
        text: "La lumière du jour et un endroit calme suffisent souvent. Une belle image et un son clair se remarquent.",
      },
      {
        title: "Règle l’usage avant",
        text: "Convenez dans le chat de l’endroit où la marque peut utiliser tes contenus, avant de tourner.",
      },
    ],
    faqs: [
      {
        question: "Faut-il beaucoup d’abonnés ?",
        answer:
          "C’est la marque qui le décide : chaque demande indique un nombre minimum d’abonnés, et certaines marques ne fixent aucune limite. Dans « Pour toi », tu vois les demandes de tes niches. Dans « Tout », tu vois tout ce qui correspond à ta langue et à ta portée.",
      },
      {
        question: "Sur quelles plateformes puis-je publier ?",
        answer: `Tu ajoutes tes plateformes avec leur nombre d’abonnés : ${PLATFORM_LIST}. La marque indique dans sa demande où publier.`,
      },
      {
        question: "En combien de temps suis-je payé ?",
        answer: `Dès que la marque valide ton post, le paiement part vers toi. Elle a ${RELEASE_REVIEW_DAYS} jours pour le faire. Si elle ne répond pas, le paiement est libéré automatiquement. Le versement passe par Stripe.`,
      },
      {
        question: "Dois-je déclarer une activité pour être créateur UGC ?",
        answer:
          "Ça dépend de ta situation, par exemple de la fréquence et du montant de tes revenus. En Allemagne, tu dois en général déclarer tes revenus aux impôts. En cas de doute, demande à un conseiller fiscal. Ceci ne constitue pas un conseil fiscal ou juridique.",
      },
      ...sharedFaqs(),
    ],
  },
};
