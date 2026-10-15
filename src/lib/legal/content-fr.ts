import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// The French legal texts: a translation of the English texts in en.ts, which follow the German texts in de.ts
// (the German version governs). Same sections and paragraphs in the same order. Keep them in step with the
// other languages when the app changes.
// Non-breaking spaces (U+00A0) stand before %, €, ?, !, : and ; and inside « ».
function frTerms(): LegalSection[] {
  return [
  {
    title: "Champ d’application et exploitant",
    body: [
      "Ces conditions s’appliquent à ton utilisation de comtor (comtor.app). L’exploitant est Teethawat Kanpai, entrepreneur individuel (Einzelunternehmen) à Berlin, en Allemagne (voir Mentions légales). En créant un compte, tu acceptes ces conditions. Pour les utilisateurs en Allemagne, c’est la version allemande de ces conditions qui s’applique.",
      "comtor n’est que la plateforme technique. Une collaboration est un contrat entre la marque et le créateur. L’exploitant n’y est pas partie, n’emploie pas le créateur et ne vend pas le produit de la marque.",
    ],
  },
  {
    title: "Qui peut utiliser comtor",
    body: [
      "Tu dois avoir au moins 18 ans, ou être autorisé à engager l’entreprise pour laquelle tu agis. Tu es responsable de tes identifiants de connexion et de l’exactitude des informations de ton profil. Un compte par personne ou par entreprise.",
    ],
  },
  {
    title: "Le service",
    body: [
      "Les marques publient une demande : ce qu’elles veulent faire réaliser, sur quelle plateforme, pour quel budget et pour quand. Les créateurs qui correspondent peuvent manifester leur intérêt, convenir d’un prix dans le chat et être payés via comtor.",
      "Nous ne promettons ni match, ni nombre de vues, ni vente, ni revenu. Ce que tu gagnes ou dépenses dépend des accords que tu conclus avec d’autres utilisateurs.",
    ],
  },
  {
    title: "Ce que tu mets en ligne",
    body: [
      "Tu conserves les droits sur ce que tu mets en ligne. Tu nous autorises à l’héberger, à le montrer aux autres utilisateurs et à en conserver une sauvegarde, tant qu’il reste sur comtor, afin que le service puisse fonctionner. Cette autorisation prend fin lorsque le contenu est supprimé, sauf pour les copies que la loi nous oblige à conserver.",
      "Le travail qu’un créateur réalise pour une marque appartient à la personne dont les deux parties conviennent. Nous ne prenons aucun droit sur ce travail.",
    ],
  },
  {
    title: "Ta responsabilité",
    body: [
      "Les marques sont responsables de leurs demandes, de leurs allégations sur le produit et des droits sur les photos qu’elles mettent en ligne. Les créateurs sont responsables de leurs publications et doivent les signaler comme publicité là où la loi l’exige (en Allemagne, par exemple, par la mention « Werbung » ou « Anzeige »).",
      "Si une marque expédie un produit, cet envoi relève de la marque et du créateur. Nous ne le vendons pas et ne l’expédions pas. Une caution, lorsqu’une demande en exige une, est une garantie entre ces deux parties, et non des frais de notre part.",
      "Si un tiers formule une réclamation contre nous en raison d’un contenu que tu as mis en ligne, d’un produit que tu as expédié ou d’une collaboration que tu as conclue, et que tu es en faute, tu prends en charge la réclamation et les frais raisonnables de défense. Si tu es consommateur, cela ne s’applique que dans la mesure où la loi le permet.",
    ],
  },
  {
    title: "Frais",
    body: [
      `Nous prélevons des frais de plateforme de ${PLATFORM_FEE_RATE * 100} % sur chaque paiement effectué via comtor. Les marques peuvent s’abonner à Pro pour ${formatCents(PRO_PRICE_CENTS.brand)}/mois, les créateurs pour ${formatCents(PRO_PRICE_CENTS.creator)}/mois. Tant que Pro est actif, les frais sont de ${PRO_PLATFORM_FEE_RATE * 100} % sur chaque paiement pour lequel la marque ou le créateur a Pro. Pro se renouvelle chaque mois jusqu’à ce que tu le résilies dans les Réglages. La résiliation arrête le prochain renouvellement. Il n’y a pas de frais de publication. Les ${FOUNDING_BRAND_LIMIT} premières marques (marques fondatrices, « founding brands ») et les ${FOUNDING_CREATOR_LIMIT} premiers créateurs (créateurs fondateurs, « founding creators ») inscrits sur comtor bénéficient de Pro gratuitement tant que leur compte existe. Ce Pro n’a pas de prix mensuel, n’est pas transférable et prend fin avec le compte. Nous pouvons le retirer si quelqu’un enfreint ces conditions.`,
      "Les frais de plateforme ne sont conservés que lorsqu’un paiement est versé au créateur. Si un paiement retenu est remboursé, la marque récupère ce paiement et nous ne conservons aucun frais dessus.",
    ],
  },
  {
    title: "Paiements retenus pour toi",
    body: [
      `Lorsqu’une marque paie, nous retenons l’argent jusqu’à ce que le créateur envoie le lien de la publication en ligne. La marque dispose alors de ${RELEASE_REVIEW_DAYS} jours pour l’approuver, ce qui verse le paiement au créateur moins nos frais, ou pour signaler un problème. Si la marque ne fait ni l’un ni l’autre, le paiement est versé. Si un problème est signalé, l’argent reste retenu pendant que nous l’examinons, puis nous le versons au créateur ou le remboursons à la marque.`,
      "Une marque peut annuler et être remboursée avant que le créateur n’envoie le lien. Une fois qu’un paiement a été versé, il ne peut plus être annulé via comtor. Les paiements par carte et les versements sont traités par Stripe. Nous ne voyons jamais le numéro de carte complet.",
    ],
  },
  {
    title: "Comportement",
    body: [
      "N’invente pas de nombres d’abonnés, ne publie pas de faux avis, ne mets pas en ligne ce sur quoi tu n’as aucun droit et ne déplace pas un deal hors de comtor pour éviter les frais. Nous pouvons supprimer des contenus et suspendre ou fermer un compte qui enfreint ces conditions ou la loi.",
      "Pour signaler un contenu illicite, ou pour nous demander de réexaminer ce que nous avons supprimé, écris à info@comtor.app. Nous l’examinerons et te communiquerons le résultat.",
      "Si nous supprimons un contenu ou suspendons un compte, nous t’en indiquons le motif par e-mail. Tu peux contester la décision à l’adresse info@comtor.app. Nous la réexaminerons et te répondrons.",
      "Seuls les utilisateurs dont la collaboration a été menée à terme et versée via comtor peuvent laisser un avis.",
    ],
  },
  {
    title: "Responsabilité",
    body: [
      "Nous sommes responsables sans limite en cas d’intention et de faute lourde, en cas d’atteinte à la vie, au corps ou à la santé, et en vertu de la loi sur la responsabilité du fait des produits (Produkthaftungsgesetz). En cas de faute légère, nous ne sommes responsables que si nous manquons à une obligation essentielle du contrat, et uniquement pour le dommage typique et prévisible pour ce type de contrat.",
      "Si tu es une entreprise, cette responsabilité en cas de faute légère est plafonnée aux frais que tu nous as payés au cours des douze mois précédant la réclamation, ou à 100 € si tu as payé moins. Ce plafond ne s’applique pas aux cas du paragraphe précédent.",
      "Nous ne sommes pas responsables de la qualité, de la licéité ni du calendrier d’une collaboration, d’une publication ou d’un produit que les utilisateurs conviennent entre eux.",
    ],
  },
  {
    title: "Fin de ton compte",
    body: [
      "Tu peux supprimer ton compte dans les Réglages. Nous pouvons suspendre ou fermer un compte qui enfreint ces conditions. Les paiements en cours sont menés à leur terme selon les règles de paiement ci-dessus.",
    ],
  },
  {
    title: "Si tu es consommateur",
    body: [
      "Si tu es consommateur dans l’UE, un droit de rétractation légal de 14 jours peut s’appliquer à Pro et aux autres services payants que tu achètes chez nous à distance. Une collaboration que tu conviens avec un autre utilisateur est un contrat avec cet utilisateur, et non avec nous. Le droit impératif de la consommation du pays où tu vis continue de s’appliquer.",
    ],
  },
  {
    title: "Droit applicable et tribunaux",
    body: [
      "Le droit allemand s’applique. Si tu es une entreprise, les tribunaux de Berlin sont compétents. Si tu es consommateur, tu peux nous poursuivre là où tu vis, et nous ne te poursuivons que là où tu vis.",
      "Tu ne peux compenser qu’avec une créance que nous ne contestons pas ou qu’un tribunal a constatée.",
    ],
  },
  {
    title: "Modifications",
    body: [
      "Nous pouvons mettre à jour ces conditions. Nous t’enverrons un e-mail pour toute modification importante au moins 15 jours avant son entrée en vigueur. Si tu ne la souhaites pas, tu peux supprimer ton compte d’ici là.",
    ],
  },
  ];
}

const FR_SENTRY = "Functional Software, Inc. (Sentry), États-Unis, enregistre les rapports d’erreurs de notre site web et de notre application (texte de l’erreur, page demandée, navigateur) afin que nous puissions trouver et corriger les erreurs (art. 6, par. 1, point f du RGPD).";

// The section that names the processors; Sentry is added there only where it is switched on.
const FR_PROVIDERS_TITLE = "Prestataires de services";

function frPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Qui est responsable",
    body: [
      "Le responsable du traitement au sens du RGPD est Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlin, Allemagne (voir Mentions légales). Pour tout ce qui concerne tes données, écris à info@comtor.app.",
    ],
  },
  {
    title: "Ton compte",
    body: [
      "Ton adresse e-mail, un mot de passe haché (jamais stocké en clair), le fait que tu sois une marque ou un créateur, le fait que ton e-mail soit vérifié et, si tu actives l’authentification à deux facteurs, le secret servant à vérifier tes codes. Nous en avons besoin pour gérer ton compte (art. 6, par. 1, point b du RGPD). Nous t’écrivons pour vérifier ton adresse, pour réinitialiser ton mot de passe quand tu le demandes, et pour te prévenir quand ton mot de passe a été modifié.",
      "Si nous suspendons un compte pour violation de nos conditions, nous enregistrons quand et pourquoi, afin que la décision puisse être réexaminée plus tard (art. 6, par. 1, point f du RGPD).",
      "Lors de l’inscription, nous enregistrons aussi quand tu as accepté les conditions et la présente politique de confidentialité et dans quelle version, ainsi que le fait que tu as confirmé avoir au moins 18 ans. Cela nous sert de preuve (art. 6, par. 1, points b et f du RGPD).",
      "Les étapes de configuration que tu as vues ou terminées sont enregistrées avec ton compte, afin que nous puissions améliorer la configuration (art. 6, par. 1, point f du RGPD).",
      "À la fin de la configuration, nous te demandons, de manière facultative, comment tu as entendu parler de nous (par exemple un moteur de recherche ou un ami). Uniquement si tu réponds, nous enregistrons l’option choisie avec ton compte, pour voir quels canaux nous amènent des gens (art. 6, par. 1, point a du RGPD). Tu peux ignorer la question. La réponse est supprimée avec le compte.",
      "Si tu arrives chez nous par un lien contenant des informations de campagne (par exemple depuis une publicité) et que tu t’inscris, nous enregistrons ces informations (source, support, campagne) avec ton compte, pour voir quelle publicité mène à des inscriptions (art. 6, par. 1, point f du RGPD). Nous ne déposons aucun cookie et n’utilisons aucun traceur pour cela : les informations figurent uniquement dans l’adresse du lien et ne sont enregistrées que lorsque tu t’inscris. Nous les supprimons avec le compte.",
      "Nous avons besoin de ton adresse e-mail et de ton mot de passe pour conclure et exécuter un contrat avec toi. Sans eux, il n’y a pas de compte. Tout le reste que tu saisis est facultatif, à l’exception de ce qui est requis pour les versements (Stripe vérifie ton identité pour cela).",
    ],
  },
  {
    title: "Profils et demandes",
    body: [
      "Ce que tu saisis dans ton profil : pour les marques, nom de l’entreprise, logo, site web, niche, description et liens sociaux ; pour les créateurs, nom affiché, photo, niche, bio, langue, et plateformes avec nombre d’abonnés et liens. Les demandes d’une marque comprennent un titre, une description, des photos, un budget, la plateforme et le contenu, la date limite de publication et les détails du produit.",
      "Les profils et les demandes sont montrés aux autres utilisateurs (c’est ainsi que le matching fonctionne) et stockés sur nos serveurs (art. 6, par. 1, point b du RGPD).",
    ],
  },
  {
    title: "Messages, offres et paiements",
    body: [
      "Les messages, les offres et les liens que les créateurs envoient pour leurs publications sont stockés et visibles par l’autre partie de la conversation. Pour les paiements, nous conservons le montant, les frais, le statut et les dates ; le paiement lui-même passe par Stripe, et nous ne voyons jamais tes données de carte complètes. Les avis, les signalements et les blocages sont stockés pour que ces fonctions marchent (art. 6, par. 1, point b du RGPD).",
    ],
  },
  {
    title: "E-mails que nous t’envoyons",
    body: [
      "Les e-mails de compte (vérification, réinitialisation du mot de passe, mot de passe modifié) sont envoyés parce que tu as un compte (art. 6, par. 1, point b du RGPD). Ils partent via Resend.",
      "Les actualités occasionnelles sur le produit sont distinctes et facultatives. Si tu coches cette case en créant un compte, ou si tu l’actives dans les Réglages, nous t’envoyons un e-mail avec un lien. Le consentement, c’est le bouton sur cette page, pas l’ouverture du message. Nous enregistrons le moment de ta confirmation (art. 6, par. 1, point a du RGPD). Tu peux l’arrêter dans les Réglages, et nous arrêtons alors. Une demande non confirmée n’est pas un consentement.",
      "Nous n’envoyons des e-mails promotionnels qu’aux personnes qui y ont consenti au préalable (art. 6, par. 1, point a du RGPD, § 7, al. 2, n° 3 UWG). Une adresse enregistrée dans une liste ne suffit pas. Nous enregistrons le nom et l’adresse e-mail, une note indiquant comment et quand tu as consenti, et quel message nous t’avons envoyé (journal d’envoi, 90 jours). Nous n’enregistrons pas si tu ouvres un e-mail ou si tu cliques sur un lien. Chacun de ces e-mails t’explique pourquoi tu le reçois et contient un lien de désinscription (aussi sous forme de désinscription en un clic dans ton programme de messagerie).",
      "Tu peux retirer ton consentement à tout moment, avec le lien dans l’e-mail ou en écrivant à info@comtor.app. Nous supprimons alors ton adresse et le journal d’envoi. Nous ne conservons qu’un hachage de l’adresse, afin de ne pas t’écrire de nouveau par erreur (art. 6, par. 1, points c et f du RGPD).",
    ],
  },
  {
    title: "Liste d’attente",
    body: [
      "Si tu laisses ton adresse e-mail sur notre page d’accueil pour savoir quand les applications iOS et Android sortent, nous l’enregistrons avec ton choix de marque ou de créateur, et nous t’envoyons d’abord un e-mail avec un lien pour confirmer que l’adresse est bien la tienne (double opt-in). Ce n’est qu’après ta confirmation que nous l’utilisons, pour cet unique e-mail (art. 6, par. 1, point a du RGPD) ; nous conservons le moment de ta confirmation comme preuve de ton consentement. Si tu ne confirmes pas, tu n’auras plus de nouvelles de notre part et l’adresse est supprimée après 30 jours. Une fois les applications sorties et après t’en avoir informé, l’adresse est supprimée. Tu peux retirer ton consentement à tout moment en écrivant à info@comtor.app, et nous la supprimons immédiatement.",
    ],
  },
  {
    title: "Sécurité et journaux",
    body: [
      "Chaque connexion enregistre l’heure, sa réussite ou son échec, ton adresse IP et ton navigateur, afin que tu puisses voir tes connexions récentes dans les Réglages et que nous puissions bloquer les abus tels que les tentatives de deviner un mot de passe. Lorsque tu utilises comtor, notre hébergeur traite aussi des données techniques (adresse IP, heure, page demandée, navigateur) pour le diffuser et le sécuriser. Les deux reposent sur notre intérêt légitime à disposer d’un service sûr (art. 6, par. 1, point f du RGPD). Nous supprimons le journal des connexions après 90 jours, l’adresse IP enregistrée lors de l’inscription après 7 jours et les compteurs anti-abus après 24 heures.",
    ],
  },
  {
    title: "Cookies, stockage local et notifications",
    body: [
      "Nous n’utilisons que des cookies strictement nécessaires : un qui te garde connecté (30 jours à partir de ta dernière visite), deux de courte durée liés à la connexion (protection contre les requêtes falsifiées, et l’adresse de retour) et un pour la langue que tu as choisie (un an). Changer ton mot de passe déconnecte tes autres appareils. Tes réglages d’apparence et de son, le fait d’avoir écarté l’indication d’installation et ton choix de marque ou de créateur sur notre page d’accueil sont enregistrés dans le stockage local de ton navigateur et ne nous sont jamais envoyés. Il n’y a aucun cookie d’analyse ni de publicité.",
      "Nous comptons combien de fois notre page d’accueil et le début de l’inscription sont ouverts, sans cookie et sans te reconnaître : par jour, un seul nombre par page et par origine (le nom du site web référent, ou la source et la campagne du lien). Nous n’enregistrons ni ton adresse IP, ni la chaîne de ton navigateur, ni aucun identifiant te concernant. Cela sert à voir quelle publicité et quelles pages amènent des visiteurs (art. 6, par. 1, point f du RGPD).",
      "Sur les pages où tu configures les versements, Stripe charge ses propres scripts. Ils peuvent déposer leurs propres cookies ou identifiants d’appareil pour prévenir la fraude (voir la politique de confidentialité de Stripe).",
      "Les notifications push ne sont envoyées que si tu les actives (art. 6, par. 1, point a du RGPD). Dans un navigateur, elles sont acheminées par son service push (d’Apple, de Google ou de Mozilla, selon ton navigateur). Dans l’application comtor pour iPhone ou Android, nous enregistrons un jeton pour ton appareil et nous les envoyons via Apple Push Notification service ou Firebase Cloud Messaging de Google. Tu peux les désactiver à tout moment dans les Réglages, dans ton navigateur ou dans les réglages de ton téléphone. Les e-mails relatifs à ton compte, comme la vérification et la réinitialisation du mot de passe, sont envoyés via Resend.",
    ],
  },
  {
    title: FR_PROVIDERS_TITLE,
    body: [
      "Ces prestataires traitent des données pour notre compte et selon nos instructions (art. 28 du RGPD) : Vercel Inc., États-Unis, qui héberge le site web et l’application ; Neon Inc., États-Unis, dont nous utilisons la base de données, hébergée à Francfort, en Allemagne ; Resend Inc., États-Unis, qui envoie nos e-mails (compte, prospection et liste d’attente) ; et Google Ireland Limited, qui achemine les notifications push vers l’application Android via Firebase Cloud Messaging.",
      "Les paiements, les versements et les vérifications d’identité requises pour les versements sont gérés par Stripe. Pour une partie de ce traitement, Stripe Payments Europe, Ltd. (Irlande) est elle-même responsable. Voir la politique de confidentialité de Stripe.",
      "Les notifications push vers l’application iPhone sont acheminées par Apple Inc., États-Unis, via Apple Push Notification service.",
      "Lorsque des données parviennent aux États-Unis, le transfert repose sur le cadre de protection des données UE–États-Unis (EU–U.S. Data Privacy Framework) ou sur les clauses contractuelles types de l’UE.",
    ],
  },
  {
    title: "Durée de conservation des données",
    body: [
      "Nous conservons tes données tant que tu as un compte. Lorsque tu supprimes ton compte dans les Réglages, ton profil, tes demandes, tes messages et tout ce qui s’y rattache sont supprimés avec lui.",
      "L’exception concerne les justificatifs de paiement (montant, frais, statut, date et identifiants Stripe). Nous devons les conserver aussi longtemps que le droit fiscal et commercial l’exige, de 8 à 10 ans selon le justificatif (art. 6, par. 1, point c du RGPD, § 147 AO et § 257 HGB). Ils sont anonymisés afin de ne plus renvoyer à toi. Stripe conserve ses propres justificatifs de paiement comme la loi l’exige.",
      "Autres durées : journal des connexions 90 jours, adresse IP enregistrée lors de l’inscription 7 jours, compteurs anti-abus 24 heures, journal d’envoi des e-mails promotionnels 90 jours, adresses non confirmées de la liste d’attente 30 jours.",
    ],
  },
  {
    title: "Tes droits",
    body: [
      "Tu peux demander l’accès à tes données (art. 15 du RGPD), leur rectification (art. 16), leur effacement (art. 17) ou leur limitation (art. 18), et les obtenir dans un format portable (art. 20). L’export dans les Réglages te donne une copie à tout moment. Tu peux t’opposer aux traitements fondés sur l’intérêt légitime (art. 21) et retirer tout consentement pour l’avenir (art. 7, par. 3). Il suffit d’écrire à info@comtor.app.",
      "Tu as aussi le droit d’introduire une réclamation auprès d’une autorité de protection des données. Pour nous, c’est la Commissaire de Berlin à la protection des données et à la liberté d’information (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Pas de décisions automatisées",
    body: [
      "Les demandes que voit un créateur sont déterminées par des règles simples (niche, langue du contenu et nombre d’abonnés), et non par une décision automatisée produisant des effets juridiques ou l’affectant de manière significative de façon similaire (art. 22 du RGPD).",
    ],
  },
  {
    title: "Modifications",
    body: ["Nous mettons à jour cette politique lorsque le service change ; la date en haut indique la version en vigueur."],
  },
  ];
  // Sentry is named only where it is switched on, so the text matches what runs.
  return sentry
    ? sections.map((section) =>
        section.title === FR_PROVIDERS_TITLE ? { ...section, body: [section.body[0], FR_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const FR_LICENSES: LegalSection[] = [
  {
    title: "Logiciels open source",
    body: [
      "comtor est construit avec des logiciels open source. Chaque paquet relève de sa propre licence, le plus souvent MIT, Apache-2.0, ISC et BSD. Les textes de licence de tout ce avec quoi l’application déployée est construite figurent dans le fichier lié ci-dessous.",
    ],
  },
  {
    title: "Polices",
    body: [
      "Le texte est composé en Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", sous la SIL Open Font License, version 1.1.",
    ],
  },
  {
    title: "Icônes et noms de marques",
    body: [
      "Les icônes de l’interface proviennent de Feather et d’Ionicons (toutes deux sous licence MIT) ; les logos des plateformes sociales viennent de Simple Icons (CC0). Les noms et logos d’Instagram, TikTok, YouTube, Twitch et X appartiennent à leurs propriétaires et ne sont affichés que pour nommer la plateforme.",
    ],
  },
  {
    title: "Photos",
    body: [
      "Les photos de produits de la page d’accueil proviennent d’Unsplash et sont utilisées sous la licence Unsplash. Les marques, les créateurs et les notes montrés dans les exemples sont inventés.",
    ],
  },
];

export const legalFr: LegalContent = {
  htmlLang: "fr",
  notice: "Cette page est une traduction proposée à titre de commodité. En cas de divergence, la version allemande fait foi.",
  updated: "7 octobre 2026",
  ui: {
    termsTitle: "Conditions d’utilisation",
    termsDescription: "Les conditions d’utilisation de comtor.",
    privacyTitle: "Politique de confidentialité",
    privacyDescription: "Quelles données personnelles comtor traite, pourquoi, et quels droits tu as.",
    imprintTitle: "Mentions légales",
    imprintDescription: "Informations conformes au § 5 DDG.",
    vatLabel: "Numéro d’identification TVA",
    licensesTitle: "Licences open source",
    licensesDescription: "Quels logiciels, polices et images comtor utilise, et sous quelles licences.",
    licensesTextFile: "Textes de licence de tous les paquets open source (fichier texte)",
    licensesOfl: "Lato : SIL Open Font License",
  },
  terms: frTerms,
  privacy: frPrivacy,
  imprint: {
    lead: "Informations conformes au § 5 DDG.",
    rows: [
      { label: "Prestataire", lines: ["Teethawat Kanpai", "Entreprise individuelle (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlin, Allemagne"] },
      { label: "Contact", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Responsable du contenu", lines: ["Teethawat Kanpai, adresse comme ci-dessus (§ 18, al. 2 MStV)"] },
    ],
    disputeTitle: "Règlement des litiges de consommation",
    dispute: "Nous ne sommes ni disposés ni tenus de participer à une procédure de règlement des litiges devant un organisme de conciliation des consommateurs.",
  },
  licenses: FR_LICENSES,
};
