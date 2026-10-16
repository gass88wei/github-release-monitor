import { defineRouting, type Pathnames } from "next-intl/routing";
import {
  defaultLocale,
  englishLocale,
  type Locale,
  locales,
} from "@/i18n/config";

export const pathnames = {
  "/": {
    en: "/",
    de: "/",
    fr: "/",
    es: "/",
    "pt-BR": "/",
    id: "/",
    hi: "/",
    "zh-CN": "/",
    ja: "/",
    ko: "/",
    tr: "/",
    vi: "/",
    it: "/",
    pl: "/",
    uk: "/",
    nl: "/",
    ru: "/",
    he: "/",
    ar: "/",
  },
  "/settings": {
    en: "/settings",
    de: "/settings",
    fr: "/settings",
    es: "/settings",
    "pt-BR": "/settings",
    id: "/settings",
    hi: "/settings",
    "zh-CN": "/settings",
    ja: "/settings",
    ko: "/settings",
    tr: "/settings",
    vi: "/settings",
    it: "/settings",
    pl: "/settings",
    uk: "/settings",
    nl: "/settings",
    ru: "/settings",
    he: "/settings",
    ar: "/settings",
  },
  "/login": {
    en: "/login",
    de: "/login",
    fr: "/login",
    es: "/login",
    "pt-BR": "/login",
    id: "/login",
    hi: "/login",
    "zh-CN": "/login",
    ja: "/login",
    ko: "/login",
    tr: "/login",
    vi: "/login",
    it: "/login",
    pl: "/login",
    uk: "/login",
    nl: "/login",
    ru: "/login",
    he: "/login",
    ar: "/login",
  },
  "/register": {
    en: "/register",
    de: "/register",
    fr: "/register",
    es: "/register",
    "pt-BR": "/register",
    id: "/register",
    hi: "/register",
    "zh-CN": "/register",
    ja: "/register",
    ko: "/register",
    tr: "/register",
    vi: "/register",
    it: "/register",
    pl: "/register",
    uk: "/register",
    nl: "/register",
    ru: "/register",
    he: "/register",
    ar: "/register",
  },
  "/forgot-password": {
    en: "/forgot-password",
    de: "/forgot-password",
    fr: "/forgot-password",
    es: "/forgot-password",
    "pt-BR": "/forgot-password",
    id: "/forgot-password",
    hi: "/forgot-password",
    "zh-CN": "/forgot-password",
    ja: "/forgot-password",
    ko: "/forgot-password",
    tr: "/forgot-password",
    vi: "/forgot-password",
    it: "/forgot-password",
    pl: "/forgot-password",
    uk: "/forgot-password",
    nl: "/forgot-password",
    ru: "/forgot-password",
    he: "/forgot-password",
    ar: "/forgot-password",
  },
  "/reset-password": {
    en: "/reset-password",
    de: "/reset-password",
    fr: "/reset-password",
    es: "/reset-password",
    "pt-BR": "/reset-password",
    id: "/reset-password",
    hi: "/reset-password",
    "zh-CN": "/reset-password",
    ja: "/reset-password",
    ko: "/reset-password",
    tr: "/reset-password",
    vi: "/reset-password",
    it: "/reset-password",
    pl: "/reset-password",
    uk: "/reset-password",
    nl: "/reset-password",
    ru: "/reset-password",
    he: "/reset-password",
    ar: "/reset-password",
  },
  "/test": {
    en: "/test",
    de: "/test",
    fr: "/test",
    es: "/test",
    "pt-BR": "/test",
    id: "/test",
    hi: "/test",
    "zh-CN": "/test",
    ja: "/test",
    ko: "/test",
    tr: "/test",
    vi: "/test",
    it: "/test",
    pl: "/test",
    uk: "/test",
    nl: "/test",
    ru: "/test",
    he: "/test",
    ar: "/test",
  },
} satisfies Pathnames<typeof locales>;

export type AppRoute = keyof typeof pathnames;

const historicalAliases: Partial<
  Record<Locale, Partial<Record<AppRoute, readonly string[]>>>
> = {};

export function getCanonicalRoutePath(route: AppRoute, locale: Locale): string {
  return pathnames[route][locale];
}

export function getRouteAliases(
  route: AppRoute,
  locale: Locale,
): readonly string[] {
  const canonicalPath = getCanonicalRoutePath(route, locale);
  const englishPath = getCanonicalRoutePath(route, englishLocale);
  const configuredAliases =
    (
      historicalAliases[locale] as
        | Partial<Record<AppRoute, readonly string[]>>
        | undefined
    )?.[route] ?? [];

  return Array.from(
    new Set(
      [englishPath, ...configuredAliases].filter(
        (candidate) => candidate !== canonicalPath,
      ),
    ),
  );
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames,
});

export { defaultLocale, locales };
