import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqPl: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Jak działają dopasowania, płatności i opinie na comtor.",
  },
  proOffer:
    " Wykup Pro za {price} miesięcznie, a prowizja spadnie do {proFee}%. Dotyczy każdej płatności, w której którakolwiek strona ma Pro.",
  items: {
    matching: {
      question: "Jak działają dopasowania?",
      answer:
        "Marki publikują zlecenie z niszą, językami treści, minimalną liczbą obserwujących i kategorią produktu. Twórcy wybierają do 3 nisz. W „Dla ciebie” widzą zlecenia z tych nisz, jeśli zlecenie jest w języku ich treści, a jedna z ich platform spełnia próg obserwujących. W „Wszystkie” widzą każde zlecenie pasujące do języka i zasięgu. Nikt nie zatwierdza dopasowań ręcznie: pasujące zlecenie pojawia się w feedzie.",
    },
    reachOut: {
      question: "Jak się odezwać?",
      answer:
        "Dotknij „Interesuje mnie” przy pasującym zleceniu. Otworzy się czat, w którym obie strony piszą do siebie bezpośrednio. Obie widzą też swoje e-maile kontaktowe.",
    },
    payments: {
      question: "Jak działają płatności?",
      answer:
        "Marka płaci twórcy przez comtor, nigdy bezpośrednio. Pieniądze są wstrzymane, aż twórca opublikuje post i wyśle link. Potem marka ma {days} dni, żeby zatwierdzić post, co od razu zwalnia pieniądze, albo zgłosić problem. Marka nie odpowiada przez {days} dni? Pieniądze zwalniamy automatycznie. comtor zatrzymuje {fee}% każdej płatności.{proOffer}",
    },
    pro: {
      question: "Czym jest plan Pro?",
      answer:
        "To opcjonalna miesięczna subskrypcja dla marek i twórców ({price} miesięcznie). Obniża prowizję z {fee}% do {proFee}% przy każdej płatności, w której marka lub twórca ma Pro. Wystarczy jedna strona. Pro zwraca się, gdy przez twoje konto przechodzi około {breakEven} miesięcznie. Stripe rozlicza cię co miesiąc. Zarządzasz subskrypcją i anulujesz ją w Ustawieniach. Pierwsi na liście dostają Pro za darmo, dopóki istnieje ich konto. Miejsca dla marek: {foundingBrands}, dla twórców: {foundingCreators}.",
    },
    noPost: {
      question: "Co, jeśli twórca nie opublikuje posta?",
      answer:
        "Marka może anulować płatność w każdej chwili, zanim twórca wyśle post, i dostaje pełną kwotę z powrotem. Post jest wysłany, ale coś jest nie tak (brakuje go, został usunięty, jest inny niż ustalono)? Marka zgłasza problem w ciągu {days} dni. Pieniądze zostają wstrzymane, a my sprawdzamy sprawę. Potem zwalniamy je twórcy albo zwracamy marce. Zwolnionej płatności nie da się cofnąć. Opinie obu stron pokazują przed płatnością, kto jest rzetelny.",
    },
    realMoney: {
      question: "Czy to prawdziwe pieniądze?",
      answer: "Tak. Płatności za współprace i subskrypcja Pro idą przez Stripe. Prawdziwe pieniądze przechodzą między prawdziwymi kontami bankowymi.",
    },
    followers: {
      question: "Jak weryfikujecie liczbę obserwujących?",
      answer:
        "Twórcy wpisują ją sami. Każda platforma prowadzi do prawdziwego konta, więc sprawdzasz realną liczbę, zanim się odezwiesz.",
    },
    reviews: {
      question: "Czy mogę zostawić opinię?",
      answer:
        "Tak. Gdy płatność zostanie zwolniona, każda strona może dodać ocenę i krótki komentarz. Opinie widać na publicznych profilach. Pomagają innym wybrać, z kim współpracować.",
    },
    contact: {
      question: "Jak się z wami skontaktować?",
      answer: "Nasze dane kontaktowe znajdziesz w Nocie prawnej.",
    },
  },
};
