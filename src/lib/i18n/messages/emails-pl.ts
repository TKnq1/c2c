import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsPl: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "Przycisk nie działa? Wklej ten link do przeglądarki:",
    stop: "Wypisz się z tych e-maili",
    tagline: "Marki spotykają odpowiednich twórców.",
    imprint: "Nota prawna",
    privacy: "Prywatność",
    numberLocale: "pl-PL",
  },
  welcome: {
    subject: "Witaj w comtor – potwierdź swój e-mail",
    preview: "Dzięki za rejestrację. Jedno kliknięcie i twój e-mail jest potwierdzony.",
    heading: "Witaj w comtor.",
    bodyCreator: "Dzięki za rejestrację. Potwierdź e-mail i przesuwaj zlecenia od marek, z budżetem widocznym na karcie.",
    bodyBrand: "Dzięki za rejestrację. Potwierdź e-mail i dodaj pierwsze zlecenie. Twórcy zgłoszą się do ciebie.",
    foundingCreator:
      "Jesteś twórcą założycielem nr {number}. Pro jest dla ciebie darmowe, dopóki istnieje twoje konto. comtor zatrzymuje {pro}% każdej płatności zamiast {standard}%, a ty dostajesz {keep}%.",
    foundingBrand:
      "Jesteś marką założycielską nr {number}. Pro jest dla ciebie darmowe, dopóki istnieje twoje konto. comtor zatrzymuje {pro}% każdej płatności zamiast {standard}%.",
    action: "Potwierdź e-mail",
    note: "Link działa przez 24 godziny. To nie ty zakładasz konto w comtor? Zignoruj ten e-mail.",
  },
  foundingNotice: {
    subject: "Pro jest dla ciebie darmowe na stałe",
    previewCreator: "Jesteś w gronie pierwszych twórców na comtor.",
    previewBrand: "Jesteś w gronie pierwszych marek na comtor.",
    heading: "Masz Pro na stałe.",
    bodyCreator:
      "Jesteś w gronie pierwszych {limit} twórców na comtor (twórca założyciel nr {number}). Dlatego Pro jest dla ciebie darmowe, dopóki istnieje twoje konto. comtor zatrzymuje {pro}% każdej płatności zamiast {standard}%, a ty dostajesz {keep}%. Nie musisz nic robić.",
    bodyBrand:
      "Jesteś w gronie pierwszych {limit} marek na comtor (marka założycielska nr {number}). Dlatego Pro jest dla ciebie darmowe, dopóki istnieje twoje konto. comtor zatrzymuje {pro}% każdej płatności zamiast {standard}%. Nie musisz nic robić.",
    subscription: "Twoja dotychczasowa subskrypcja Pro nadal działa i jest rozliczana. Możesz ją anulować w Ustawieniach i zachować Pro.",
    action: "Zobacz swój plan",
    note: "Dostajesz ten e-mail, bo masz konto w comtor. Dotyczy twojego planu i nie jest reklamą.",
  },
  marketingWelcome: {
    note: "Dostajesz ten e-mail, bo istnieje twoja zgoda na wiadomości od comtor. Możesz ją wycofać w każdej chwili linkiem poniżej.",
    noteWithReason:
      "Dostajesz ten e-mail, bo istnieje twoja zgoda na wiadomości od comtor ({reason}). Możesz ją wycofać w każdej chwili linkiem poniżej.",
    hint: "Najpierw się rozejrzyj. Rejestracja jest na stronie.",
    creator: {
      preview: "Zarabiaj na postach w mediach społecznościowych.",
      heading: "Zarabiaj na postach w mediach społecznościowych.",
      headingNamed: "{name}, zarabiaj na postach w mediach społecznościowych.",
      body: "Na comtor marki dodają płatne zlecenia, a ty przesuwasz te, które cię interesują. Budżet jest na karcie. Marka płaci, zanim opublikujesz, a ty dostajesz {keep}%.",
      steps: {
        swipe: {
          title: "Przesuń zlecenie.",
          text: "W prawo znaczy: chcę. W lewo znaczy: pomijam. Marka widzi twój profil i może do ciebie napisać.",
        },
        budget: {
          title: "Budżet jest na karcie.",
          text: "Koniec z DM-ami o stawkę. Każde zlecenie pokazuje stawkę, co opublikować i czy produkt jest w zestawie.",
        },
        paid: {
          title: "Płatność przed publikacją.",
          text: "Przyjmij ofertę, a marka płaci najpierw. Pieniądze są wstrzymane, aż twój post pojawi się w sieci.",
        },
        keep: {
          title: "Dostajesz {keep}%.",
          text: "Marka ma na zatwierdzenie posta {days} dni. Jeśli nie odpowie, pieniądze i tak trafiają do ciebie. Z Pro ({price} € miesięcznie) dostajesz {proKeep}%.",
        },
      },
      crowdOne: "marka już tu jest",
      crowdMany: "marek już z nami",
      action: "Zobacz płatne zlecenia",
    },
    brand: {
      preview: "Rozwijaj swoją markę z twórcami treści.",
      heading: "Rozwijaj swoją markę z twórcami treści.",
      headingNamed: "{name}, rozwijaj swoją markę z twórcami treści.",
      body: "Na comtor dodajesz produkt, budżet i opis tego, co ma powstać. Pasujący twórcy przesuwają w prawo i zgłaszają się do ciebie. Płacisz po ustaleniach. Pieniądze są wstrzymane, aż post pojawi się w sieci.",
      steps: {
        post: {
          title: "Dodaj produkt i budżet.",
          text: "Zdjęcia, budżet, platforma i opis publikacji. Twórcy widzą to jako kartę w swoim feedzie.",
        },
        come: {
          title: "Twórcy zgłaszają się do ciebie.",
          text: "Twórcy z twojej niszy przesuwają w prawo. Widzisz ich zasięgi i opinie i wybierasz, kto pasuje.",
        },
        chat: {
          title: "Ustalcie szczegóły na czacie.",
          text: "Wyślij ofertę. Gdy twórca ją przyjmie, płacisz, a pieniądze są wstrzymane, aż post pojawi się w sieci.",
        },
        paidOut: {
          title: "Dopiero wtedy wypłata.",
          text: "Najpierw sprawdzasz opublikowany post. Bez opłaty stałej: comtor zatrzymuje {fee}% każdej płatności, z Pro ({price} € miesięcznie) {proFee}%.",
        },
      },
      crowdOne: "twórca już tu jest",
      crowdMany: "twórców już z nami",
      action: "Dodaj pierwsze zlecenie",
    },
  },
  verification: {
    subject: "Potwierdź swój e-mail w comtor",
    preview: "Potwierdź, że to twój adres. Link działa przez 24 godziny.",
    heading: "Potwierdź swój e-mail.",
    body: "Potwierdź, że ten adres należy do twojego konta comtor.",
    action: "Potwierdź e-mail",
    note: "Link działa przez 24 godziny. To nie ty zakładasz konto w comtor? Zignoruj ten e-mail.",
  },
  passwordReset: {
    subject: "Zresetuj hasło do comtor",
    preview: "Ustaw nowe hasło. Link działa przez 1 godzinę.",
    heading: "Zresetuj hasło.",
    body: "Ktoś poprosił o reset hasła do comtor. Jeśli to ty, ustaw nowe.",
    action: "Ustaw nowe hasło",
    note: "Link działa jednorazowo, przez 1 godzinę. Nowe hasło wylogowuje cię wszędzie. To nie ty prosisz o reset? Zignoruj ten e-mail, a hasło się nie zmieni.",
  },
  passwordChanged: {
    subject: "Twoje hasło do comtor zostało zmienione",
    preview: "Jeśli to ty, wszystko w porządku.",
    heading: "Twoje hasło zostało zmienione.",
    body: "Hasło do comtor właśnie się zmieniło, a inne twoje urządzenia zostały wylogowane. Jeśli to ty, wszystko w porządku.",
    action: "Zresetuj hasło",
    note: "To nie ty? Zresetuj hasło od razu. To wyloguje osobę, która je zmieniła.",
  },
  accountSuspended: {
    subject: "Twoje konto comtor zostało zawieszone",
    preview: "Oto powód i sposób odwołania.",
    heading: "Twoje konto zostało zawieszone.",
    body: "Zawiesiliśmy twoje konto comtor. Powód: {reason} Na czas zawieszenia nie możesz się logować. Otwarte zlecenia konta marki zamykamy.",
    action: "Odwołaj się od decyzji",
    objectSubject: "Zawieszone konto",
    note: "Uważasz, że to pomyłka? Odpowiedz na ten e-mail lub napisz na info@comtor.app. Sprawdzimy to jeszcze raz i odpowiemy.",
  },
  test: {
    subject: "Testowy e-mail z comtor",
    preview: "Jeśli to czytasz, e-maile z comtor działają.",
    heading: "Działa.",
    body: "To testowy e-mail z panelu admina. Skoro jest w skrzynce, e-maile o rejestracji, potwierdzeniu i haśle też docierają do ludzi.",
    action: "Otwórz comtor",
    note: "Wysłane przez admina z /admin/email. Nic nie musisz robić.",
  },
  marketingConsent: {
    subject: "Potwierdź nowości od comtor",
    preview: "Jeden przycisk i możemy wysyłać okazjonalne nowości o comtor.",
    heading: "Potwierdź nowości o produkcie.",
    body: "Z tego adresu wpłynęła prośba o okazjonalne e-maile o comtor. Naciśnij przycisk na następnej stronie, żeby potwierdzić. Do tego czasu ten adres nie dostaje żadnych nowości o produkcie.",
    action: "Sprawdź i potwierdź",
    note: "To nie ty prosisz? Zignoruj ten e-mail. Nic się nie włączy, dopóki nie naciśniesz przycisku.",
  },
  waitlistConfirmation: {
    subject: "Potwierdź miejsce na liście oczekujących comtor",
    preview: "Jedno kliknięcie i dostaniesz od nas wiadomość w dniu premiery aplikacji.",
    heading: "Potwierdź swój e-mail.",
    body: "Ten adres zapisano na powiadomienie, gdy aplikacje comtor pojawią się na iOS i Androidzie. Potwierdź, że adres jest twój, a trafisz na listę.",
    action: "Potwierdź e-mail",
    note: "Wyślemy jeden e-mail, w dniu premiery aplikacji. To nie ty się zapisujesz? Zignoruj ten e-mail, a nic od nas nie dostaniesz.",
  },
  // A deal notice and the documents of a deal (src/lib/deals/notices.ts, billing). {number}: document number, {title}: request title, {replaces}: the cancelled document.
  dealNotice: {
    headingAction: "Twój deal cię potrzebuje.",
    headingNews: "Nowości w twoim dealu.",
    action: "Otwórz w comtor",
    note: "Dostajesz tę wiadomość, bo w grę wchodzi termin, anulowanie lub pieniądze. Tych wiadomości nie można wyłączyć.",
  },
  dealDocument: {
    invoice: { subject: "Twoja faktura {number}", heading: "Twoja faktura jest gotowa.", body: "Faktura {number} dla „{title}” jest w załączniku jako PDF. Znajdziesz ją też w Deals, Faktury." },
    credit: { subject: "Twoja nota kredytowa {number}", heading: "Twoja nota kredytowa jest gotowa.", body: "Nota kredytowa {number} dla „{title}” jest w załączniku jako PDF. Znajdziesz ją też w Deals, Faktury." },
    corrected: { subject: "Dokument poprawiony: {replaces} zastąpiony przez {number}", heading: "Dokument został poprawiony.", body: "Dokument {replaces} dla „{title}” został anulowany i zastąpiony przez {number}. Anulowanie i nowy dokument są w załączniku jako PDF." },
    action: "Otwórz dokument",
    note: "Dostajesz tę wiadomość, bo wystawiono dokument do jednego z twoich dealów. Zachowaj go do księgowości.",
  },
};
