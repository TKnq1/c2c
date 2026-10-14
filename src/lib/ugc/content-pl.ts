import {
  PLATFORM_FEE_RATE,
  PLATFORMS,
  PRO_PLATFORM_FEE_RATE,
  PRO_SUBSCRIPTION_PRICE_CENTS,
  RELEASE_REVIEW_DAYS,
} from "@/lib/constants";
import type { UgcContent, UgcFaqItem } from "@/lib/ugc/types";

// Polish UGC landing pages. Same structure as the German source (src/lib/seo-pages.ts, content-de.ts); the
// texts are written freely, not word for word. No invented numbers or quotes, and no "escrow" wording on
// public pages until the payment model is cleared (see docs/legal-readiness.md).

const NBSP = " ";
const FEE = `${PLATFORM_FEE_RATE * 100}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}%`;
const PRO_PRICE = `${PRO_SUBSCRIPTION_PRICE_CENTS / 100}${NBSP}€`;

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} i ${PLATFORMS[PLATFORMS.length - 1]}`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "Jak wygląda płatność?",
      answer: `Marka płaci przez platformę, nie bezpośrednio twórcy. Pieniądze są wstrzymane, dopóki twórca nie opublikuje posta i nie prześle linku, a marka nie zatwierdzi posta. Marka ma na to ${RELEASE_REVIEW_DAYS} dni i w tym czasie może zgłosić problem. Jeśli nie zareaguje, płatność zostaje zwolniona automatycznie. Płatności obsługuje Stripe.`,
    },
    {
      question: "Ile kosztuje comtor?",
      answer: `Rejestracja jest darmowa i nie ma opłaty stałej. comtor pobiera ${FEE} każdej płatności. Opłata jest potrącana z wypłaty twórcy. Marka płaci dokładnie ustaloną kwotę. Marki i twórcy mogą wykupić opcjonalny abonament Pro za ${PRO_PRICE} miesięcznie. Wtedy opłata wynosi ${PRO_FEE} przy każdej płatności, w której Pro ma jedna ze stron.`,
    },
    {
      question: "Czy płatne posty trzeba oznaczać jako reklamę?",
      answer:
        "W Niemczech płatne posty trzeba zwykle oznaczać jako reklamę. Ustalcie oznaczenie na czacie przed publikacją. To nie jest porada prawna.",
    },
    {
      question: "Jak sprawdzana jest liczba obserwujących?",
      answer:
        "Liczby podają sami twórcy. Każda platforma w profilu jest połączona z prawdziwym kontem, więc marka sprawdzi liczbę przed pierwszą wiadomością. Marka ustala w zleceniu minimalną liczbę obserwujących. Zlecenie widzą tylko pasujący twórcy.",
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
      question: `Jak jako ${opts.brandWho} znajdę pasujących twórców?`,
      answer: `Dodajesz zlecenie: nisza „${opts.label}”, język treści, minimalna liczba obserwujących, kategoria produktu${hint}, budżet, platforma i zakres dostawy. Twórcy, którzy wybrali „${opts.label}” jako niszę i pasują językiem oraz zasięgiem, widzą je w feedzie. Zainteresowani odzywają się na czacie. comtor nie sprawdza zleceń ręcznie.`,
    },
    {
      question: `Gdzie jako twórca znajdę zlecenia ${opts.creatorFrom}?`,
      answer: `Zakładasz profil, wybierasz do trzech nisz, na przykład „${opts.label}”, i dodajesz swoje platformy z liczbą obserwujących. W feedzie w zakładce „Dla ciebie” widzisz zlecenia z twoich nisz. W zakładce „Wszystkie” widzisz resztę, która pasuje do twojego języka i zasięgu. Przy każdym zleceniu jest budżet i wymagania. Kliknięcie „Interesuje mnie” otwiera czat z marką.`,
    },
  ];
}

export const ugcContentPl: UgcContent = {
  htmlLang: "pl",
  ogLocale: "pl_PL",
  ui: {
    hubTitle: "Znajdź twórców UGC i zleć im treści",
    hubDescription:
      "Marki znajdują twórców UGC do wideo i zdjęć, twórcy płatne zlecenia. Dodaj zlecenie, ustal szczegóły na czacie, zapłać przez platformę. Za darmo.",
    hubIntro:
      "Marki potrzebują wideo i zdjęć od prawdziwych ludzi. Twórcy chcą za nie dostać zapłatę. comtor łączy jednych z drugimi: marka dodaje zlecenie, pasujący twórcy się zgłaszają, płatność idzie przez platformę.",
    signupNote: "Zarejestruj się za darmo. comtor działa w przeglądarce, język wybierasz na starcie.",
    creatorCardTitle: "Jesteś twórcą?",
    creatorCardBody:
      "Tak znajdziesz płatne zlecenia UGC i dostaniesz zapłatę przez platformę: jak zarabiać jako twórca UGC.",
    byNicheTitle: "UGC według niszy",
    howTitle: "Jak działa comtor",
    forBrands: "Dla marek",
    forCreators: "Dla twórców",
    hubBrandSteps: [
      "Dodaj zlecenie: nisza, język, minimalna liczba obserwujących, kategoria produktu, budżet i zakres dostawy.",
      "Twórcy się zgłaszają: pasujący widzą zlecenie w feedzie i piszą do ciebie na czacie.",
      "Zapłać i zatwierdź: płacisz przez platformę i zatwierdzasz post, gdy jest dobry.",
    ],
    hubCreatorSteps: [
      "Załóż profil: do trzech nisz i twoje platformy z liczbą obserwujących.",
      "Przeglądaj zlecenia: w feedzie widzisz budżet i wymagania, zanim się zgłosisz.",
      "Opublikuj post i odbierz zapłatę: po publikacji przesyłasz link. Gdy marka go zatwierdzi (najpóźniej po {days} dniach), płatność trafia do wypłaty.",
    ],
    faqTitle: "Częste pytania",
    formatsTitle: "Te formaty działają w niszy „{label}”",
    nicheBrandSteps: [
      "Dodaj zlecenie: nisza „{label}”, język, minimalna liczba obserwujących, budżet i zakres dostawy.",
      "Twórcy się zgłaszają: pasujący widzą zlecenie w feedzie i piszą do ciebie na czacie.",
      "Zapłać i zatwierdź: płacisz przez platformę i zatwierdzasz post, gdy jest dobry.",
    ],
    nicheCreatorSteps: [
      "Załóż profil: do trzech nisz, na przykład „{label}”, i twoje platformy z liczbą obserwujących.",
      "Przeglądaj zlecenia: w feedzie widzisz budżet i wymagania, zanim się zgłosisz.",
      "Opublikuj post i odbierz zapłatę: po publikacji przesyłasz link. Gdy marka go zatwierdzi (najpóźniej po {days} dniach), płatność trafia do wypłaty.",
    ],
    nicheReadyTitle: "Gotowy na pierwsze zlecenie w niszy „{label}”?",
    overviewLead: "Czym jest UGC i jak działa comtor, wyjaśniamy w skrócie:",
    overviewLink: "Znajdź twórców UGC",
    creatorCrumb: "Zostań twórcą",
    creatorFooterLink: "Zostań twórcą",
    creatorDoingTitle: "Co robią twórcy UGC",
    creatorStartTitle: "Tak zaczynasz w comtor",
    creatorTipsTitle: "Wskazówki do dobrych treści UGC",
    creatorReadyTitle: "Gotowy na pierwsze płatne zlecenie?",
    creatorBrandHint: "Szukasz twórców dla swojej marki? Czym jest UGC i jak działa comtor, wyjaśniamy w skrócie:",
    nicheNavLabel: "UGC według niszy",
  },
  niches: [
    {
      slug: "beauty",
      niche: "Beauty",
      label: "Uroda",
      title: "Twórcy UGC dla marek beauty",
      description:
        "Marki beauty znajdują twórców UGC do wideo z rutyną, unboxingów i zdjęć produktów. Twórcy znajdują płatne zlecenia w swojej niszy. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek beauty",
      ogLines: ["Znajdź twórców UGC", "dla marek beauty."],
      lead: "Pielęgnacja skóry, makijaż, włosy, perfumy: kto kupuje kosmetyk, chce zobaczyć go na prawdziwych ludziach. comtor łączy marki beauty z twórcami, którzy robią właśnie takie wideo i zdjęcia. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Wideo z rutyną",
          text: "Poranna lub wieczorna rutyna, w której produkt pojawia się krok po kroku. Działa organicznie i jako reklama.",
        },
        {
          title: "Unboxing i pierwsze wrażenia",
          text: "Rozpakuj, wypróbuj i powiedz szczerze, co widzisz. Dobre dla nowości i zestawów.",
        },
        {
          title: "Aplikacja z bliska",
          text: "Jak się nakłada produkt, jak się czuje na skórze, jak długo trzyma? Zbliżenia zamiast studyjnego looku.",
        },
        {
          title: "Zdjęcia z codzienności",
          text: "Zdjęcia produktu w łazience, przy toaletce lub w podróży, do sklepu, social mediów i reklam.",
        },
      ],
      faqs: [
        {
          question: "Jak jako marka beauty znajdę pasujących twórców?",
          answer:
            "Dodajesz zlecenie: nisza „Uroda”, język treści, minimalna liczba obserwujących, kategoria produktu, budżet, platforma i to, co twórca ma dostarczyć. Twórcy, którzy wybrali „Uroda” jako niszę i pasują językiem oraz zasięgiem, widzą je w feedzie. Zainteresowani piszą do ciebie na czacie. comtor nie sprawdza zleceń ręcznie.",
        },
        {
          question: "Gdzie jako twórca znajdę zlecenia od marek beauty?",
          answer:
            "Zakładasz profil, wybierasz do trzech nisz, na przykład „Uroda”, i dodajesz swoje platformy z liczbą obserwujących. W feedzie w zakładce „Dla ciebie” widzisz zlecenia z twoich nisz. W zakładce „Wszystkie” widzisz resztę, która pasuje do twojego języka i zasięgu. Przy każdym zleceniu jest budżet i wymagania. Kliknięcie „Interesuje mnie” otwiera czat z marką.",
        },
        {
          question: "Czy dostanę produkt za darmo?",
          answer:
            "Decyduje marka. W zleceniu jest informacja, czy produkt jest w zestawie. Resztę, na przykład zakres dostawy i termin, ustalacie wcześniej na czacie.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "fitness",
      niche: "Fitness",
      label: "Fitness",
      title: "Twórcy UGC dla marek fitness",
      description:
        "Marki fitness znajdują twórców UGC do wideo z treningów, testów produktów i dem aplikacji. Twórcy znajdują płatne zlecenia w swojej niszy. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek fitness",
      ogLines: ["Znajdź twórców UGC", "dla marek fitness."],
      lead: "Odzież sportowa, sprzęt, suplementy, aplikacje fitness: w fitnessie przekonuje to, czego ludzie naprawdę używają. comtor łączy marki fitness z twórcami, którzy wiarygodnie pokazują trening i codzienność. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Trening z produktem",
          text: "Jeden trening, w którym widać ubranie, sprzęt lub akcesoria w użyciu.",
        },
        {
          title: "Test produktu po kilku tygodniach",
          text: "Szczery przegląd: dopasowanie, trwałość, obsługa. Pomaga kupującym zdecydować.",
        },
        {
          title: "Codzienność i rutyna",
          text: "Plan treningowy, meal prep lub poranna rutyna, w której produkt jest naturalną częścią dnia.",
        },
        {
          title: "Demo aplikacji i trackera",
          text: "Nagranie ekranu z komentarzem: jak wygląda trening z aplikacją i co pokazuje tracker?",
        },
      ],
      faqs: [
        {
          question: "Jak jako marka fitness znajdę pasujących twórców?",
          answer:
            "Dodajesz zlecenie: nisza „Fitness”, język treści, minimalna liczba obserwujących, kategoria produktu (na przykład odzież sportowa, suplementy lub aplikacja), budżet, platforma i zakres dostawy. Twórcy, którzy wybrali „Fitness” jako niszę i pasują językiem oraz zasięgiem, widzą je w feedzie. Zainteresowani odzywają się na czacie.",
        },
        {
          question: "Gdzie jako twórca znajdę zlecenia od marek fitness?",
          answer:
            "Zakładasz profil, wybierasz do trzech nisz, na przykład „Fitness”, i dodajesz swoje platformy z liczbą obserwujących. W feedzie w zakładce „Dla ciebie” widzisz zlecenia z twoich nisz. W zakładce „Wszystkie” widzisz resztę, która pasuje do twojego języka i zasięgu. Kliknięcie „Interesuje mnie” otwiera czat.",
        },
        {
          question: "Co obowiązuje przy suplementach i deklaracjach o działaniu?",
          answer:
            "Deklaracje o zdrowiu i działaniu podlegają ścisłym przepisom. Przy suplementach diety ustalcie przed nagraniem na czacie, co wolno powiedzieć, a czego nie. To nie jest porada prawna.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "food",
      niche: "Food",
      label: "Jedzenie",
      title: "Twórcy UGC dla marek spożywczych",
      description:
        "Marki spożywcze znajdują twórców UGC do wideo z przepisami, degustacji i zdjęć jedzenia. Twórcy znajdują płatne zlecenia w swojej niszy. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek spożywczych",
      ogLines: ["Znajdź twórców UGC", "dla marek spożywczych."],
      lead: "Przekąski, napoje, przyprawy, pudełka do gotowania, składniki do pieczenia: przy jedzeniu liczy się to, czy od razu chcesz spróbować sam. comtor łączy marki spożywcze z twórcami, którzy gotują, próbują i pokazują. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Wideo z przepisem",
          text: "Danie lub napój krok po kroku, z produktem jako składnikiem. Pokazuje, jak go używać.",
        },
        {
          title: "Degustacja i pierwsze wrażenia",
          text: "Spróbuj i opisz szczerze, co czujesz. Pasuje do nowości, smaków i zestawów prezentowych.",
        },
        {
          title: "Unboxing pudełek do gotowania",
          text: "Rozpakuj i pokaż pudełko do gotowania, zestaw degustacyjny lub prezentowy.",
        },
        {
          title: "Codzienność i meal prep",
          text: "Śniadanie, gotowanie na cały tydzień lub przekąska po drodze: produkt jako zwykła część dnia.",
        },
        {
          title: "Zdjęcia jedzenia",
          text: "Dania i produkty na zdjęciach, do sklepu, social mediów i reklam.",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Jedzenie",
          brandWho: "marka spożywcza",
          creatorFrom: "od marek spożywczych",
          categories: "na przykład jedzenie i napoje",
        }),
        {
          question: "Kto zajmuje się wysyłką produktów?",
          answer:
            "Ustalacie to wcześniej na czacie. Zlecenie podaje tylko, czy produkt jest w zestawie. Jak i kiedy dotrze, zwłaszcza przy towarach chłodzonych lub szybko psujących się, uzgadniacie przed nagraniem.",
        },
        {
          question: "Co obowiązuje przy deklaracjach o zdrowiu i działaniu?",
          answer:
            "Hasła takie jak „zdrowe” czy „wzmacnia odporność” są w przypadku żywności ściśle regulowane. Ustalcie wcześniej na czacie, co wolno powiedzieć. To nie jest porada prawna.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "mode",
      niche: "Fashion",
      label: "Moda",
      title: "Twórcy UGC dla marek modowych",
      description:
        "Marki modowe znajdują twórców UGC do wideo z outfitami, przymiarek i zdjęć stylizacji. Twórcy znajdują płatne zlecenia w swojej niszy. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek modowych",
      ogLines: ["Znajdź twórców UGC", "dla marek modowych."],
      lead: "Ubrania, buty, akcesoria, biżuteria: modę kupuje się, bo można się w niej zobaczyć. comtor łączy marki modowe z twórcami, którzy noszą rzeczy, łączą je i pokazują, jak leżą na co dzień. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Wideo z outfitem",
          text: "Jedna rzecz, kilka looków: jak połączyć ją do pracy, na co dzień i na wieczór.",
        },
        {
          title: "Przymiarka ze szczerą opinią",
          text: "Dopasowanie, materiał i rozmiar w porównaniu z tabelą rozmiarów, własnymi słowami.",
        },
        {
          title: "Haul i unboxing",
          text: "Rozpakuj paczkę i pokaż rzeczy po kolei.",
        },
        {
          title: "Zdjęcia stylizacji z codzienności",
          text: "Looki na ulicy, w kawiarni lub w domu, do sklepu, social mediów i reklam.",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Moda",
          brandWho: "marka modowa",
          creatorFrom: "od marek modowych",
        }),
        {
          question: "Jak to działa z rozmiarem i dopasowaniem?",
          answer:
            "Rozmiar ustalacie wcześniej na czacie, żeby rzecz pasowała, a post się udał. Czy produkt jest w zestawie, widać w zleceniu marki.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "tech",
      niche: "Tech",
      label: "Technologia",
      title: "Twórcy UGC dla marek technologicznych",
      description:
        "Marki technologiczne znajdują twórców UGC do unboxingów, testów na co dzień i dem aplikacji. Twórcy znajdują płatne zlecenia w swojej niszy. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek technologicznych",
      ogLines: ["Znajdź twórców UGC", "dla marek technologicznych."],
      lead: "Gadżety, akcesoria, smart home, oprogramowanie i aplikacje: przy technologii kupujący chcą zobaczyć, jak produkt działa na co dzień. comtor łączy marki technologiczne z twórcami, którzy rozpakowują, konfigurują i tłumaczą. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Unboxing i konfiguracja",
          text: "Rozpakuj, włącz, skonfiguruj: pierwsze minuty z produktem, takie jak widzi je kupujący.",
        },
        {
          title: "Test na co dzień",
          text: "Tydzień z produktem: co działa, co irytuje, dla kogo warto?",
        },
        {
          title: "Demo funkcji",
          text: "Nagranie ekranu lub zbliżenie z wyjaśnieniem funkcji, którą łatwo przeoczyć.",
        },
        {
          title: "Jak to zrobić",
          text: "Krótki poradnik: jak rozwiązać typowy problem z pomocą produktu?",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Technologia",
          brandWho: "marka technologiczna",
          creatorFrom: "od marek technologicznych",
          categories: "na przykład elektronika lub oprogramowanie/aplikacja",
        }),
        {
          question: "Jak jako twórca dostanę dostęp do urządzeń lub oprogramowania?",
          answer:
            "Przy urządzeniach marka podaje w zleceniu, czy produkt jest w zestawie. Przy oprogramowaniu i aplikacjach ustalacie na czacie, jak dostaniesz konto testowe lub pełną wersję.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "reisen",
      niche: "Travel",
      label: "Podróże",
      title: "Twórcy UGC dla firm turystycznych",
      description:
        "Hotele, biura podróży i marki turystyczne znajdują twórców UGC do reelsów z podróży, oprowadzania po noclegach i zdjęć. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla firm turystycznych",
      ogLines: ["Znajdź twórców UGC", "dla firm turystycznych."],
      lead: "Hotele, apartamenty wakacyjne, organizatorzy podróży, bagaż i aplikacje podróżnicze: podróże rezerwuje się po zdjęciach i doświadczeniach innych. comtor łączy firmy turystyczne z twórcami, którzy pokazują miejsca i noclegi tak, jak widać je na miejscu. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Reel z podróży",
          text: "Miejsce w 30 sekund: przyjazd, najlepsze momenty, jedna wskazówka na drogę.",
        },
        {
          title: "Oprowadzanie po noclegu",
          text: "Pokój, widok, śniadanie, detale: jak to naprawdę wygląda i jak się w tym czuje.",
        },
        {
          title: "Trzy wskazówki na miejscu",
          text: "Krótki format z ulubionymi miejscami, jedzeniem i drogami poza znanym szlakiem.",
        },
        {
          title: "Lista rzeczy i akcesoria podróżne",
          text: "Walizka, plecak, adapter: produkty w prawdziwym użyciu w drodze.",
        },
        {
          title: "Seria zdjęć",
          text: "Zdjęcia miejsca i noclegu, do strony, social mediów i reklam.",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Podróże",
          brandWho: "firma turystyczna",
          creatorFrom: "z branży turystycznej",
        }),
        {
          question: "Kto płaci za dojazd i nocleg?",
          answer:
            "Ustalacie to wcześniej na czacie i zapisujecie. Zlecenie podaje budżet na post. Czy podróż, nocleg lub usługi na miejscu są dodatkowo w cenie, uzgadniacie wprost.",
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "gaming",
      niche: "Gaming",
      label: "Gry",
      title: "Twórcy UGC dla marek gamingowych",
      description:
        "Marki gamingowe znajdują twórców UGC do klipów z rozgrywki, testów sprzętu i pierwszych wrażeń. Twórcy znajdują płatne zlecenia. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek gamingowych",
      ogLines: ["Znajdź twórców UGC", "dla marek gamingowych."],
      lead: "Gry, konsole, sprzęt PC, akcesoria i aplikacje gamingowe: gracze ufają ludziom, którzy sami grają. comtor łączy marki gamingowe z twórcami, którzy grają, testują i komentują. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Klip z rozgrywki",
          text: "Scena z gry z komentarzem: co ją wyróżnia, co rzuca się w oczy?",
        },
        {
          title: "Pierwsze wrażenia",
          text: "Pierwsze godziny w nowej grze, otwarcie i bez scenariusza.",
        },
        {
          title: "Test sprzętu",
          text: "Mysz, słuchawki, klawiatura lub kontroler w użyciu: wrażenia, jakość, przydatność na co dzień.",
        },
        {
          title: "Najlepsze momenty ze streamu lub sesji",
          text: "Najlepsze chwile ze streamu lub rundy gry, krótko zmontowane.",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Gry",
          brandWho: "marka gamingowa",
          creatorFrom: "od marek gamingowych",
        }),
        {
          question: "Na jakich platformach mogę publikować?",
          answer: `Twórcy dodają swoje platformy z liczbą obserwujących: ${PLATFORM_LIST}. Marka podaje w zleceniu, gdzie ma pojawić się post.`,
        },
        ...sharedFaqs(),
      ],
    },
    {
      slug: "lifestyle",
      niche: "Lifestyle",
      label: "Lifestyle",
      title: "Twórcy UGC dla marek lifestyle",
      description:
        "Marki lifestyle znajdują twórców UGC do wideo z codzienności, aranżacji wnętrz i zdjęć produktów. Twórcy znajdują płatne zlecenia. Zacznij za darmo.",
      heading: "Znajdź twórców UGC dla marek lifestyle",
      ogLines: ["Znajdź twórców UGC", "dla marek lifestyle."],
      lead: "Dom, gospodarstwo domowe, organizacja, wellness, akcesoria: produkty lifestyle przekonują, gdy widać je w prawdziwej codzienności. comtor łączy marki lifestyle z twórcami, którzy pokazują swoje życie. Twórcy znajdują tu płatne zlecenia ze swojej niszy.",
      formats: [
        {
          title: "Dzień z produktem",
          text: "Od rana do wieczora: gdzie produkt pojawia się w ciągu dnia i co ułatwia.",
        },
        {
          title: "Aranżacja wnętrza",
          text: "Mieszkanie, kąt lub półka urządzone z produktem. Pokazuje, jak wygląda w prawdziwym domu.",
        },
        {
          title: "Unboxing i montaż",
          text: "Rozpakuj, zmontuj, wypróbuj, razem z potknięciami.",
        },
        {
          title: "Rutyna i nawyki",
          text: "Poranna, wieczorna lub niedzielna rutyna, w której produkt pojawia się naturalnie.",
        },
        {
          title: "Zdjęcia z codzienności",
          text: "Zdjęcia produktu w prawdziwych sytuacjach, do sklepu, social mediów i reklam.",
        },
      ],
      faqs: [
        ...matchingFaqs({
          label: "Lifestyle",
          brandWho: "marka lifestyle",
          creatorFrom: "od marek lifestyle",
        }),
        {
          question: "Co, jeśli moje treści łączą kilka tematów?",
          answer:
            "Możesz wybrać do trzech nisz, na przykład „Lifestyle”, „Moda” i „Jedzenie”. W feedzie w zakładce „Dla ciebie” widzisz najpierw zlecenia z tych nisz. W zakładce „Wszystkie” widzisz resztę, która pasuje do twojego języka i zasięgu.",
        },
        ...sharedFaqs(),
      ],
    },
  ],
  hubFaqs: [
    {
      question: "Czym jest UGC?",
      answer:
        "UGC to User Generated Content. W marketingu to wideo i zdjęcia, które dla marki robią prawdziwi ludzie: wypróbowują produkt, filmują, pokazują. Marka używa ich na swoich kanałach, w sklepie lub w reklamach. Liczy się treść, nie zasięg twórcy.",
    },
    {
      question: "Czym różni się od influencer marketingu?",
      answer:
        "W influencer marketingu najważniejszy jest zasięg jednej osoby: post pojawia się na jej kanale. W UGC najważniejsza jest treść, więc dobre wideo zrobi też mniejszy twórca. W comtor marka podaje w zleceniu platformę i minimalną liczbę obserwujących. Może też zostawić oba pola otwarte.",
    },
    {
      question: "Jak znajdę twórców UGC dla swojej marki?",
      answer:
        "Zakładasz za darmo profil marki i dodajesz zlecenie: nisza, język, kategoria produktu, budżet i to, co twórca ma dostarczyć. Pasujący twórcy widzą je w feedzie i odzywają się na czacie.",
    },
    ...sharedFaqs(),
  ],
  creator: {
    title: "Jak zarabiać jako twórca UGC",
    description:
      "Znajdź płatne zlecenia od marek jako twórca UGC: przeglądaj zlecenia z budżetem, ustalaj szczegóły na czacie, odbieraj zapłatę przez platformę. Za darmo.",
    heading: "Jak zarabiać jako twórca UGC",
    ogLines: ["Zarabiaj jako", "twórca UGC."],
    lead: "Twórcy UGC robią dla marek wideo i zdjęcia tak, jak pokazałby produkt prawdziwy klient. W comtor widzisz płatne zlecenia z budżetem i wymaganiami. Klikasz, że cię interesują, i resztę ustalasz na czacie. Zapłatę dostajesz przez platformę.",
    doing: [
      {
        title: "Wideo z produktem",
        text: "Wypróbuj produkt, nagraj go i pokaż szczerze, jak działa na co dzień.",
      },
      {
        title: "Unboxingi i pierwsze wrażenia",
        text: "Rozpakuj, wypróbuj, powiedz, co widzisz. Bez studia, za to wiarygodnie.",
      },
      {
        title: "Użycie i poradniki",
        text: "Pokaż krok po kroku, jak używać produktu i co ułatwia.",
      },
      {
        title: "Zdjęcia w prawdziwych sytuacjach",
        text: "Zdjęcia produktu z codzienności, do sklepu, social mediów i reklam marki.",
      },
    ],
    steps: [
      "Załóż profil: wybierz do trzech nisz, dodaj swoje platformy z liczbą obserwujących i podaj język swoich treści.",
      "Przeglądaj zlecenia: w feedzie widzisz budżet, platformę i zakres dostawy, zanim się zgłosisz.",
      "Pokaż zainteresowanie: kliknięcie „Interesuje mnie” otwiera czat z marką. Tam ustalacie szczegóły i termin.",
      "Opublikuj i prześlij link: po publikacji przesyłasz link do posta.",
      `Odbierz zapłatę: marka zatwierdza post, najpóźniej po ${RELEASE_REVIEW_DAYS} dniach, a płatność trafia do wypłaty.`,
    ],
    tips: [
      {
        title: "Pokaż produkt od razu",
        text: "W pierwszych sekundach ma być jasne, o co chodzi i co potrafi produkt.",
      },
      {
        title: "Mów naturalnie",
        text: "Szczere wrażenia własnymi słowami zwykle przekonują bardziej niż wyuczony tekst.",
      },
      {
        title: "Zadbaj o światło i dźwięk",
        text: "Światło dzienne i cichy kąt często wystarczą. Dobry obraz i czysty dźwięk robią różnicę.",
      },
      {
        title: "Ustal wcześniej prawa do użycia",
        text: "Zanim nagrasz, ustal na czacie, gdzie marka może używać twoich treści.",
      },
    ],
    faqs: [
      {
        question: "Czy potrzebuję dużo obserwujących?",
        answer:
          "Decyduje marka. Każde zlecenie podaje minimalną liczbę obserwujących, a niektóre marki nie ustalają dolnej granicy. W zakładce „Dla ciebie” widzisz zlecenia z twoich nisz. W zakładce „Wszystkie” widzisz resztę, która pasuje do twojego języka i zasięgu.",
      },
      {
        question: "Na jakich platformach mogę publikować?",
        answer: `Dodajesz swoje platformy z liczbą obserwujących: ${PLATFORM_LIST}. Marka podaje w zleceniu, gdzie ma pojawić się post.`,
      },
      {
        question: "Jak szybko dostanę pieniądze?",
        answer: `Gdy marka zatwierdzi twój post, płatność trafia do ciebie. Marka ma na to ${RELEASE_REVIEW_DAYS} dni. Jeśli nie odpowie, płatność zostaje zwolniona automatycznie. Wypłata idzie przez Stripe.`,
      },
      {
        question: "Czy jako twórca UGC muszę założyć działalność gospodarczą?",
        answer:
          "To zależy od twojej sytuacji, na przykład od tego, jak często i ile zarabiasz. Przychody w Niemczech trzeba zwykle zgłosić podatkowo. W razie wątpliwości zapytaj doradcę podatkowego. To nie jest porada podatkowa ani prawna.",
      },
      ...sharedFaqs(),
    ],
  },
};
