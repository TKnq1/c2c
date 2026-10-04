import type { Messages } from "@/lib/i18n/messages/en";

export type DeepString<T> = T extends string ? string : { [K in keyof T]: DeepString<T[K]> };

export type Catalog = DeepString<Messages>;
