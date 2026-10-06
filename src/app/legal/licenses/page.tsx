import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { canonical } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { LEGAL_UPDATED } from "@/lib/legal/version";

export const metadata: Metadata = { title: "Open-source licenses", alternates: canonical("/legal/licenses") };

const EN: { title: string; body: string[] }[] = [
  {
    title: "Open-source software",
    body: [
      "comtor is built with open-source software. Each package comes under its own licence, mostly MIT, Apache-2.0, ISC and BSD. The licence texts of everything the deployed app is built with are in the file linked below.",
    ],
  },
  {
    title: "Fonts",
    body: [
      "Text is set in Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", under the SIL Open Font License, Version 1.1.",
    ],
  },
  {
    title: "Icons and brand names",
    body: [
      "Interface icons come from Feather and Ionicons (both MIT licence); the marks of the social platforms are from Simple Icons (CC0). The names and logos of Instagram, TikTok, YouTube, Twitch and X belong to their owners and are shown only to name the platform.",
    ],
  },
  {
    title: "Photos",
    body: [
      "The product photos on the landing page are from Unsplash and used under the Unsplash License. The brands, creators and ratings shown in the examples are made up.",
    ],
  },
];

const DE: { title: string; body: string[] }[] = [
  {
    title: "Open-Source-Software",
    body: [
      "comtor ist mit Open-Source-Software gebaut. Jedes Paket steht unter einer eigenen Lizenz, meist MIT, Apache-2.0, ISC und BSD. Die Lizenztexte von allem, womit die ausgelieferte App gebaut ist, stehen in der Datei, die unten verlinkt ist.",
    ],
  },
  {
    title: "Schriften",
    body: [
      "Der Text ist in Lato gesetzt, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", unter der SIL Open Font License, Version 1.1.",
    ],
  },
  {
    title: "Icons und Markennamen",
    body: [
      "Oberflächen-Icons stammen von Feather und Ionicons (beide MIT-Lizenz), die Zeichen der sozialen Plattformen von Simple Icons (CC0). Die Namen und Logos von Instagram, TikTok, YouTube, Twitch und X gehören ihren Inhabern und werden nur gezeigt, um die Plattform zu benennen.",
    ],
  },
  {
    title: "Fotos",
    body: [
      "Die Produktfotos auf der Startseite stammen von Unsplash und werden unter der Unsplash-Lizenz genutzt. Die Marken, Creator und Bewertungen in den Beispielen sind erfunden.",
    ],
  },
];

export default async function LicensesPage() {
  const german = (await getLocale()) === "de";
  return (
    <div className="flex flex-col gap-6">
      <LegalDocument
        title={german ? "Open-Source-Lizenzen" : "Open-source licenses"}
        updated={german ? LEGAL_UPDATED.de : LEGAL_UPDATED.en}
        intro={german ? "Welche Software, Schriften und Bilder comtor verwendet, und unter welchen Lizenzen." : "Which software, fonts and images comtor uses, and under which licences."}
        sections={german ? DE : EN}
      />
      <p className="text-sm">
        <a href="/third-party-notices.txt" className="font-medium underline underline-offset-2">
          {german ? "Lizenztexte aller Open-Source-Pakete (Textdatei)" : "Licence texts of all open-source packages (text file)"}
        </a>
        {" · "}
        <a href="/email/fonts/OFL.txt" className="font-medium underline underline-offset-2">
          {german ? "Lato: SIL Open Font License" : "Lato: SIL Open Font License"}
        </a>
      </p>
    </div>
  );
}
