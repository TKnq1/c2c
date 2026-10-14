import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// Polskie teksty prawne. To tłumaczenie pomocnicze: obowiązuje wersja niemiecka (de.ts). Trzymaj je w zgodzie
// z tekstami niemieckimi i angielskimi (en.ts), gdy zmieni się kod (nowe dane, nowy dostawca usług).
function plTerms(): LegalSection[] {
  return [
  {
    title: "Zakres obowiązywania i operator",
    body: [
      "Niniejszy regulamin dotyczy korzystania przez ciebie z comtor (comtor.app). Operatorem jest Teethawat Kanpai, jednoosobowy przedsiębiorca (Einzelunternehmen) w Berlinie, w Niemczech (zob. Impressum). Założenie konta oznacza, że akceptujesz ten regulamin. Wobec użytkowników w Niemczech obowiązuje niemiecka wersja tego regulaminu.",
      "comtor jest wyłącznie platformą techniczną. Współpraca jest umową między marką a twórcą. Operator nie jest jej stroną, nie zatrudnia twórcy i nie sprzedaje produktu marki.",
    ],
  },
  {
    title: "Kto może korzystać z comtor",
    body: [
      "Musisz mieć ukończone 18 lat albo mieć uprawnienie do zaciągania zobowiązań w imieniu firmy, w której działasz. Odpowiadasz za swoje dane logowania i za prawdziwość informacji w swoim profilu. Jedno konto na osobę lub firmę.",
    ],
  },
  {
    title: "Usługa",
    body: [
      "Marki publikują zlecenie: co ma zostać wykonane, na jakiej platformie, za jaki budżet i do kiedy. Pasujący twórcy mogą zgłosić zainteresowanie, ustalić cenę na czacie i otrzymać zapłatę przez comtor.",
      "Nie obiecujemy dopasowania, liczby wyświetleń, sprzedaży ani żadnego dochodu. To, ile zarobisz lub wydasz, zależy od umów, które zawrzesz z innymi użytkownikami.",
    ],
  },
  {
    title: "Co przesyłasz",
    body: [
      "Zachowujesz prawa do tego, co przesyłasz. Zezwalasz nam na hostowanie tych treści, pokazywanie ich innym użytkownikom i przechowywanie kopii zapasowej, tak długo, jak pozostają w comtor, aby usługa mogła działać. To zezwolenie wygasa wraz z usunięciem treści, z wyjątkiem kopii, które musimy zachować z mocy prawa.",
      "Praca, którą twórca wykonuje dla marki, należy do tego, co ustalą między sobą oboje. Nie przejmujemy praw do tej pracy.",
    ],
  },
  {
    title: "Twoja odpowiedzialność",
    body: [
      "Marki odpowiadają za swoje zlecenia, swoje stwierdzenia o produkcie i za prawa do przesyłanych zdjęć. Twórcy odpowiadają za swoje publikacje i muszą oznaczać je jako reklamę tam, gdzie wymaga tego prawo (w Niemczech na przykład jako „Werbung” lub „Anzeige”).",
      "Jeśli marka wysyła produkt, ta przesyłka dotyczy wyłącznie marki i twórcy. Nie sprzedajemy go i nie wysyłamy. Kaucja, jeśli zlecenie jej wymaga, jest zabezpieczeniem między tymi dwiema stronami, a nie naszą opłatą.",
      "Jeśli osoba trzecia wystąpi przeciwko nam z roszczeniem z powodu treści przesłanych przez ciebie, produktu wysłanego przez ciebie lub współpracy uzgodnionej przez ciebie, a ponosisz za to winę, pokryjesz to roszczenie oraz uzasadnione koszty obrony. Jeśli jesteś konsumentem, dotyczy to tylko tego, na co pozwala prawo.",
    ],
  },
  {
    title: "Opłaty",
    body: [
      `Pobieramy prowizję platformy w wysokości ${PLATFORM_FEE_RATE * 100}% od każdej płatności dokonanej przez comtor. Marki i twórcy mogą wykupić Pro za ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/miesiąc. Gdy Pro jest aktywne, prowizja wynosi ${PRO_PLATFORM_FEE_RATE * 100}% od każdej płatności, w której marka lub twórca ma Pro. Pro odnawia się co miesiąc, dopóki nie anulujesz go w Ustawieniach. Anulowanie zatrzymuje następne odnowienie. Nie ma opłaty za publikację zleceń. Pierwsze marki (marki założycielskie; limit: ${FOUNDING_BRAND_LIMIT}) i pierwsi twórcy (twórcy założyciele; limit: ${FOUNDING_CREATOR_LIMIT}), którzy zarejestrowali się w comtor, dostają Pro bezpłatnie, dopóki istnieje ich konto. To Pro nie ma ceny miesięcznej, nie może być przeniesione i wygasa wraz z kontem. Możemy je odebrać, jeśli ktoś naruszy ten regulamin.`,
      "Prowizję platformy zatrzymujemy tylko wtedy, gdy płatność zostaje zwolniona na rzecz twórcy. Jeśli wstrzymana płatność zostanie zwrócona, marka dostaje tę płatność z powrotem i nie zatrzymujemy od niej prowizji.",
    ],
  },
  {
    title: "Płatności wstrzymane dla ciebie",
    body: [
      `Gdy marka płaci, wstrzymujemy pieniądze do chwili, gdy twórca prześle link do opublikowanej publikacji. Marka ma wtedy czas, aby ją zatwierdzić, co zwalnia płatność na rzecz twórcy pomniejszoną o naszą prowizję, albo zgłosić problem (liczba dni: ${RELEASE_REVIEW_DAYS}). Jeśli marka nie zrobi żadnej z tych rzeczy, płatność zostaje zwolniona. Jeśli zgłoszono problem, pieniądze pozostają wstrzymane, gdy go sprawdzamy, a następnie albo zwalniamy je na rzecz twórcy, albo zwracamy marce.`,
      "Marka może anulować zlecenie i otrzymać zwrot, zanim twórca prześle link. Po zwolnieniu płatności nie można jej cofnąć przez comtor. Płatności kartą i wypłaty obsługuje Stripe. Nigdy nie widzimy pełnego numeru karty.",
    ],
  },
  {
    title: "Zasady postępowania",
    body: [
      "Nie zmyślaj liczby obserwujących, nie publikuj fałszywych opinii, nie przesyłaj niczego, do czego nie masz praw, i nie przenoś umowy poza comtor, aby uniknąć prowizji. Możemy usunąć treści oraz zawiesić lub zamknąć konto, które narusza ten regulamin lub prawo.",
      "Aby zgłosić treści niezgodne z prawem albo poprosić nas o ponowne rozpatrzenie czegoś, co usunęliśmy, napisz na info@comtor.app. Sprawdzimy to i poinformujemy cię o wyniku.",
      "Jeśli usuwamy treści lub zawieszamy konto, podajemy ci powód e-mailem. Możesz złożyć sprzeciw wobec tej decyzji na info@comtor.app. Rozpatrzymy ją ponownie i odpowiemy ci.",
      "Opinię mogą wystawić tylko użytkownicy, których współpraca została zakończona i wypłacona przez comtor.",
    ],
  },
  {
    title: "Odpowiedzialność",
    body: [
      "Odpowiadamy bez ograniczeń za winę umyślną i rażące niedbalstwo, za uszczerbek na życiu, ciele lub zdrowiu oraz na podstawie ustawy o odpowiedzialności za produkt (Produkthaftungsgesetz). W przypadku lekkiego niedbalstwa odpowiadamy tylko wtedy, gdy naruszymy obowiązek istotny dla umowy, i tylko za szkodę typową i dającą się przewidzieć dla tego rodzaju umowy.",
      "Jeśli jesteś przedsiębiorcą, ta odpowiedzialność za lekkie niedbalstwo jest ograniczona do opłat zapłaconych nam przez ciebie w ciągu dwunastu miesięcy przed zgłoszeniem roszczenia albo do 100 €, jeśli zapłacono mniej. To ograniczenie nie dotyczy przypadków z poprzedniego akapitu.",
      "Nie odpowiadamy za jakość, zgodność z prawem ani terminowość współpracy, publikacji lub produktu, które użytkownicy uzgadniają między sobą.",
    ],
  },
  {
    title: "Zakończenie konta",
    body: [
      "Możesz usunąć swoje konto w Ustawieniach. Możemy zawiesić lub zamknąć konto, które narusza ten regulamin. Otwarte płatności są kończone zgodnie z powyższymi zasadami dotyczącymi płatności.",
    ],
  },
  {
    title: "Jeśli jesteś konsumentem",
    body: [
      "Jeśli jesteś konsumentem w UE, do Pro i do innych płatnych usług kupowanych od nas na odległość może mieć zastosowanie ustawowe 14-dniowe prawo do odstąpienia od umowy. Współpraca, którą uzgadniasz z innym użytkownikiem, jest umową z tym użytkownikiem, a nie z nami. Obowiązujące bezwzględnie prawo konsumenckie kraju, w którym mieszkasz, nadal ma zastosowanie.",
    ],
  },
  {
    title: "Prawo i sądy",
    body: [
      "Obowiązuje prawo niemieckie. Jeśli jesteś przedsiębiorcą, właściwe są sądy w Berlinie. Jeśli jesteś konsumentem, możesz pozwać nas w miejscu swojego zamieszkania, a my pozwiemy ciebie tylko w miejscu twojego zamieszkania.",
      "Możesz dokonać potrącenia tylko z wierzytelności, której nie kwestionujemy lub którą rozstrzygnął sąd.",
    ],
  },
  {
    title: "Zmiany",
    body: [
      "Możemy aktualizować ten regulamin. O istotnej zmianie poinformujemy cię e-mailem co najmniej 15 dni przed jej wejściem w życie. Jeśli jej nie chcesz, możesz do tego czasu usunąć swoje konto.",
    ],
  },
  ];
}

const PL_SENTRY = "Functional Software, Inc. (Sentry), USA, zapisuje raporty o błędach z naszej strony internetowej i aplikacji (tekst błędu, żądana strona, przeglądarka), abyśmy mogli znajdować i naprawiać błędy (art. 6 ust. 1 lit. f RODO).";

function plPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Kto odpowiada za dane",
    body: [
      "Administratorem w rozumieniu RODO jest Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlin, Niemcy (zob. Impressum). W każdej sprawie dotyczącej twoich danych pisz na info@comtor.app.",
    ],
  },
  {
    title: "Twoje konto",
    body: [
      "Twój adres e-mail, zahaszowane hasło (nigdy nieprzechowywane jawnym tekstem), informacja, czy jesteś marką, czy twórcą, czy twój e-mail jest zweryfikowany oraz, jeśli włączysz uwierzytelnianie dwuskładnikowe, sekret służący do sprawdzania twoich kodów. Potrzebujemy tego do prowadzenia twojego konta (art. 6 ust. 1 lit. b RODO). Wysyłamy ci e-maile, aby zweryfikować twój adres, zresetować hasło na twoją prośbę i poinformować cię, kiedy hasło zostało zmienione.",
      "Jeśli zawieszamy konto za naruszenie naszego regulaminu, zapisujemy, kiedy i dlaczego, aby decyzję można było później sprawdzić (art. 6 ust. 1 lit. f RODO).",
      "Przy rejestracji zapisujemy też, kiedy regulamin i ta polityka prywatności zostały zaakceptowane i w jakiej były wersji, a także że potwierdzono ukończenie 18 lat. To nasz dowód (art. 6 ust. 1 lit. b i f RODO).",
      "To, które kroki konfiguracji zostały wyświetlone lub ukończone, jest zapisywane przy twoim koncie, abyśmy mogli ulepszać konfigurację (art. 6 ust. 1 lit. f RODO).",
      "Na końcu konfiguracji pytamy, dobrowolnie, skąd o nas wiesz (na przykład z wyszukiwarki lub od znajomego). Tylko jeśli odpowiesz, zapisujemy wybraną opcję przy twoim koncie, aby zobaczyć, które kanały przyprowadzają do nas ludzi (art. 6 ust. 1 lit. a RODO). Możesz pominąć to pytanie. Odpowiedź jest usuwana wraz z kontem.",
      "Jeśli trafisz do nas przez link z danymi kampanii (na przykład z reklamy) i się zarejestrujesz, zapisujemy te dane (źródło, medium, kampania) przy twoim koncie, aby zobaczyć, które reklamy prowadzą do rejestracji (art. 6 ust. 1 lit. f RODO). Nie ustawiamy w tym celu żadnego pliku cookie i nie używamy trackera: dane znajdują się tylko w adresie linku i są zapisywane dopiero przy rejestracji. Usuwamy je wraz z kontem.",
      "Twój adres e-mail i hasło są nam potrzebne, aby zawrzeć z tobą umowę i ją wykonywać. Bez nich nie ma konta. Wszystko inne, co wpisujesz, jest opcjonalne, z wyjątkiem tego, co jest wymagane do wypłat (do tego Stripe weryfikuje twoją tożsamość).",
    ],
  },
  {
    title: "Profile i zlecenia",
    body: [
      "To, co wpisujesz w swoim profilu: w przypadku marek nazwa firmy, logo, strona internetowa, nisza, opis i linki społecznościowe; w przypadku twórców wyświetlana nazwa, zdjęcie, nisza, bio, język oraz platformy z liczbą obserwujących i linkami. Zlecenie marki zawiera tytuł, opis, zdjęcia, budżet, platformę i treść, termin publikacji oraz dane o produkcie.",
      "Profile i zlecenia są pokazywane innym użytkownikom (tak działa dopasowanie) i przechowywane na naszych serwerach (art. 6 ust. 1 lit. b RODO).",
    ],
  },
  {
    title: "Wiadomości, oferty i płatności",
    body: [
      "Wiadomości, oferty i linki do publikacji przesyłane przez twórców są przechowywane i widoczne dla drugiej strony rozmowy. W przypadku płatności zapisujemy kwotę, prowizję, status i daty; sama płatność przechodzi przez Stripe, a my nigdy nie widzimy pełnych danych twojej karty. Opinie, zgłoszenia i blokady są przechowywane, aby te funkcje działały (art. 6 ust. 1 lit. b RODO).",
    ],
  },
  {
    title: "E-maile, które do ciebie wysyłamy",
    body: [
      "E-maile dotyczące konta (weryfikacja, reset hasła, zmienione hasło) są wysyłane, ponieważ masz konto (art. 6 ust. 1 lit. b RODO). Wychodzą przez Resend.",
      "Okazjonalne nowości o produkcie są odrębne i opcjonalne. Jeśli zaznaczysz to pole przy zakładaniu konta albo włączysz je w Ustawieniach, wyślemy ci e-mailem link. Zgodą jest przycisk na tej stronie, a nie otwarcie wiadomości. Zapisujemy czas potwierdzenia (art. 6 ust. 1 lit. a RODO). Możesz je wyłączyć w Ustawieniach, a my wtedy przestajemy. Niepotwierdzone żądanie nie jest zgodą.",
      "Wiadomości promocyjne wysyłamy tylko osobom, które wcześniej się na to zgodziły (art. 6 ust. 1 lit. a RODO, § 7 ust. 2 pkt 3 UWG). Sam adres zapisany na liście nie wystarcza. Zapisujemy imię i nazwisko oraz adres e-mail, notatkę o tym, jak i kiedy wyrażono zgodę, oraz którą wiadomość ci wysłaliśmy (dziennik wysyłki, 90 dni). Nie rejestrujemy, czy otwierasz e-mail ani czy klikasz w link. Każdy z tych e-maili mówi, dlaczego go dostajesz, i zawiera link do wypisania się (także jako wypisanie jednym kliknięciem w twoim programie pocztowym).",
      "Zgodę możesz wycofać w każdej chwili, linkiem w e-mailu albo pisząc na info@comtor.app. Wtedy usuwamy twój adres i dziennik wysyłki. Zachowujemy tylko hash adresu, abyśmy przez pomyłkę nie napisali do ciebie ponownie (art. 6 ust. 1 lit. c i f RODO).",
    ],
  },
  {
    title: "Lista oczekujących",
    body: [
      "Jeśli zostawisz swój adres e-mail na naszej stronie głównej, aby dowiedzieć się, kiedy pojawią się aplikacje na iOS i Androida, zapisujemy go razem z informacją, czy wybrano markę, czy twórcę, i najpierw wysyłamy ci e-mail z linkiem do potwierdzenia, że adres jest twój (double opt-in). Dopiero po potwierdzeniu używamy go, wyłącznie do tego jednego e-maila (art. 6 ust. 1 lit. a RODO); czas twojego potwierdzenia zachowujemy jako dowód zgody. Jeśli nie potwierdzisz, nie odezwiemy się do ciebie ponownie, a adres zostanie usunięty po 30 dniach. Gdy aplikacje się pojawią i damy ci znać, adres zostaje usunięty. Zgodę możesz wycofać w każdej chwili, pisząc na info@comtor.app, a my usuniemy adres od razu.",
    ],
  },
  {
    title: "Bezpieczeństwo i dzienniki",
    body: [
      "Każde logowanie zapisuje czas, informację, czy się powiodło, twój adres IP i twoją przeglądarkę, aby umożliwić ci zobaczenie ostatnich logowań w Ustawieniach i abyśmy mogli powstrzymywać nadużycia, takie jak zgadywanie haseł. Gdy korzystasz z comtor, nasz dostawca hostingu przetwarza też dane techniczne (adres IP, czas, żądana strona, przeglądarka), aby ją dostarczyć i zapewnić jej bezpieczeństwo. Oba te przypadki opierają się na naszym prawnie uzasadnionym interesie w bezpiecznej usłudze (art. 6 ust. 1 lit. f RODO). Dziennik logowań usuwamy po 90 dniach, adres IP zapisany przy rejestracji po 7 dniach, a liczniki nadużyć po 24 godzinach.",
    ],
  },
  {
    title: "Pliki cookie, pamięć lokalna i powiadomienia",
    body: [
      "Używamy wyłącznie plików cookie ściśle niezbędnych: jednego, który utrzymuje cię zalogowanego (30 dni od ostatniej wizyty), dwóch krótkotrwałych związanych z logowaniem (ochrona przed sfałszowanymi żądaniami oraz adres, do którego wrócić) i jednego dla wybranego przez ciebie języka (jeden rok). Zmiana hasła wylogowuje twoje pozostałe urządzenia. Ustawienia wyglądu i dźwięku, informacja, czy podpowiedź o instalacji została zamknięta, oraz czy na naszej stronie głównej wybrano markę, czy twórcę, są zapisywane w pamięci lokalnej twojej przeglądarki i nigdy nam nie są wysyłane. Nie ma analitycznych ani reklamowych plików cookie.",
      "Liczymy, jak często otwierane są nasza strona główna i początek rejestracji, bez pliku cookie i bez rozpoznawania ciebie: dziennie tylko jedna liczba na stronę i źródło (nazwa strony odsyłającej albo źródło i kampania z linku). Nie zapisujemy twojego adresu IP, ciągu identyfikującego twoją przeglądarkę ani żadnego identyfikatora dotyczącego ciebie. Służy to temu, aby zobaczyć, które reklamy i które strony przyprowadzają odwiedzających (art. 6 ust. 1 lit. f RODO).",
      "Na stronach, na których konfigurujesz wypłaty, Stripe ładuje własne skrypty. Mogą one ustawiać własne pliki cookie lub identyfikatory urządzenia w celu zapobiegania oszustwom (zob. politykę prywatności Stripe).",
      "Powiadomienia push są wysyłane tylko wtedy, gdy je włączysz (art. 6 ust. 1 lit. a RODO). W przeglądarce są dostarczane przez jej usługę push (od Apple, Google lub Mozilli, zależnie od przeglądarki). W aplikacji comtor na iPhone'a lub Androida zapisujemy token twojego urządzenia i wysyłamy je przez Apple Push Notification service lub Firebase Cloud Messaging od Google. Możesz je wyłączyć w każdej chwili w Ustawieniach, w przeglądarce lub w ustawieniach telefonu. E-maile dotyczące konta, takie jak weryfikacja i reset hasła, są wysyłane przez Resend.",
    ],
  },
  {
    title: "Dostawcy usług",
    body: [
      "Ci dostawcy przetwarzają dane w naszym imieniu i zgodnie z naszymi poleceniami (art. 28 RODO): Vercel Inc., USA, który hostuje stronę internetową i aplikację; Neon Inc., USA, której bazy danych używamy, hostowanej we Frankfurcie, w Niemczech; Resend Inc., USA, która dostarcza nasze e-maile (dotyczące konta, wiadomości promocyjne i listy oczekujących); oraz Google Ireland Limited, który dostarcza powiadomienia push do aplikacji na Androida przez Firebase Cloud Messaging.",
      "Płatności, wypłaty i weryfikacje tożsamości wymagane do wypłat obsługuje Stripe. W przypadku części tego przetwarzania Stripe Payments Europe, Ltd. (Irlandia) odpowiada samodzielnie. Zob. politykę prywatności Stripe.",
      "Powiadomienia push do aplikacji na iPhone'a dostarcza Apple Inc., USA, przez Apple Push Notification service.",
      "Tam, gdzie dane trafiają do USA, transfer opiera się na unijno-amerykańskich Ramach Ochrony Danych (EU–U.S. Data Privacy Framework) lub na standardowych klauzulach umownych UE.",
    ],
  },
  {
    title: "Jak długo przechowujemy dane",
    body: [
      "Przechowujemy twoje dane tak długo, jak masz konto. Gdy usuniesz konto w Ustawieniach, twój profil, zlecenia, wiadomości i wszystko, co z nimi związane, zostaje usunięte razem z nim.",
      "Wyjątkiem są zapisy płatności (kwota, prowizja, status, data i identyfikatory Stripe). Musimy je przechowywać tak długo, jak wymagają tego prawo podatkowe i handlowe, od 8 do 10 lat zależnie od rodzaju zapisu (art. 6 ust. 1 lit. c RODO, §§ 147 AO i 257 HGB). Są anonimizowane, tak aby już na ciebie nie wskazywały. Stripe przechowuje własne zapisy płatności zgodnie z wymogami prawa.",
      "Inne okresy: dziennik logowań 90 dni, adres IP zapisany przy rejestracji 7 dni, liczniki nadużyć 24 godziny, dziennik wysyłki wiadomości promocyjnych 90 dni, niepotwierdzone adresy z listy oczekujących 30 dni.",
    ],
  },
  {
    title: "Twoje prawa",
    body: [
      "Możesz żądać dostępu do swoich danych (art. 15 RODO), ich sprostowania (art. 16), usunięcia (art. 17) lub ograniczenia przetwarzania (art. 18) oraz otrzymania ich w przenośnym formacie (art. 20). Eksport w Ustawieniach daje ci kopię w każdej chwili. Możesz wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie (art. 21) i wycofać każdą zgodę ze skutkiem na przyszłość (art. 7 ust. 3). Wystarczy napisać na info@comtor.app.",
      "Masz też prawo wnieść skargę do organu ochrony danych. W naszym przypadku jest to Berliński Komisarz ds. Ochrony Danych i Wolności Informacji (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Brak zautomatyzowanych decyzji",
    body: [
      "To, które zlecenia widzi twórca, jest określane prostymi regułami (nisza, język treści i liczba obserwujących), a nie zautomatyzowanym podejmowaniem decyzji wywołującym skutki prawne lub podobnie istotnie na ciebie wpływającym (art. 22 RODO).",
    ],
  },
  {
    title: "Zmiany",
    body: ["Aktualizujemy tę politykę, gdy zmienia się usługa; data na górze pokazuje obowiązującą wersję."],
  },
  ];
  // Sentry jest wymieniony tylko tam, gdzie jest włączony, aby tekst odpowiadał temu, co działa.
  return sentry
    ? sections.map((section) =>
        section.title === "Dostawcy usług" ? { ...section, body: [section.body[0], PL_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const PL_LICENSES: LegalSection[] = [
  {
    title: "Oprogramowanie open source",
    body: [
      "comtor jest zbudowany z oprogramowania open source. Każdy pakiet podlega własnej licencji, głównie MIT, Apache-2.0, ISC i BSD. Teksty licencji wszystkiego, z czego zbudowana jest wdrożona aplikacja, znajdują się w pliku podlinkowanym poniżej.",
    ],
  },
  {
    title: "Czcionki",
    body: [
      "Tekst jest złożony czcionką Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) z zastrzeżoną nazwą czcionki (Reserved Font Name) „Lato”, na licencji SIL Open Font License, wersja 1.1.",
    ],
  },
  {
    title: "Ikony i nazwy marek",
    body: [
      "Ikony interfejsu pochodzą z Feather i Ionicons (obie na licencji MIT); znaki platform społecznościowych pochodzą z Simple Icons (CC0). Nazwy i logo Instagrama, TikToka, YouTube'a, Twitcha i X należą do ich właścicieli i są pokazywane wyłącznie po to, aby nazwać platformę.",
    ],
  },
  {
    title: "Zdjęcia",
    body: [
      "Zdjęcia produktów na stronie głównej pochodzą z Unsplash i są używane na licencji Unsplash License. Marki, twórcy i oceny pokazane w przykładach są zmyślone.",
    ],
  },
];

export const legalPl: LegalContent = {
  htmlLang: "pl",
  notice: "Ta strona jest tłumaczeniem pomocniczym. W razie różnic obowiązuje wersja niemiecka.",
  updated: "7 października 2026",
  ui: {
    termsTitle: "Regulamin",
    termsDescription: "Zasady korzystania z comtor.",
    privacyTitle: "Polityka prywatności",
    privacyDescription: "Jakie dane osobowe przetwarza comtor, dlaczego i jakie masz prawa.",
    imprintTitle: "Impressum",
    imprintDescription: "Informacje zgodnie z § 5 DDG.",
    vatLabel: "Numer identyfikacji podatkowej VAT",
    licensesTitle: "Licencje open source",
    licensesDescription: "Jakie oprogramowanie, czcionki i obrazy wykorzystuje comtor i na jakich licencjach.",
    licensesTextFile: "Teksty licencji wszystkich pakietów open source (plik tekstowy)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: plTerms,
  privacy: plPrivacy,
  imprint: {
    lead: "Informacje zgodnie z § 5 DDG.",
    rows: [
      { label: "Usługodawca", lines: ["Teethawat Kanpai", "Jednoosobowy przedsiębiorca (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlin, Niemcy"] },
      { label: "Kontakt", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Odpowiedzialny za treść", lines: ["Teethawat Kanpai, adres jak wyżej (§ 18 ust. 2 MStV)"] },
    ],
    disputeTitle: "Pozasądowe rozstrzyganie sporów konsumenckich",
    dispute: "Nie jesteśmy gotowi ani zobowiązani do udziału w postępowaniach w sprawie rozstrzygania sporów przed konsumencką komisją arbitrażową.",
  },
  licenses: PL_LICENSES,
};
