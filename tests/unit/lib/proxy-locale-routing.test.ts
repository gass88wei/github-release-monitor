import type { NextRequest, NextResponse } from "next/server";
import { getRouteAliases } from "@/i18n/routing";
import { hasCanonicalLocalePrefix } from "@/lib/localized-path";
import {
  buildRedirectUrl,
  buildRoutePathLookup,
  getCurrentLocaleFromResponse,
  getLocalizedLoginPath,
  getRouteKeyForPath,
  getRouteMatchForPath,
  normalizedRestPath,
  normalizeRoutePathForLookup,
  resolveLocalizedRestPath,
  splitLocaleFromPath,
} from "@/lib/proxy/locale-routing";

describe("proxy/locale-routing", () => {
  it.each([
    ["", "/"],
    ["/", "/"],
    ["settings", "/settings"],
    ["/settings", "/settings"],
    ["/settings/", "/settings"],
  ])("normalizes rest path %j to %j", (input, expected) => {
    expect(normalizedRestPath(input)).toBe(expected);
  });

  it.each([
    ["/de/settings/", { locale: "de", restPath: "/settings" }],
    ["/DE/settings", { locale: "de", restPath: "/settings" }],
    ["/en/login", { locale: "en", restPath: "/login" }],
    ["/zh-cn/settings", { locale: "zh-CN", restPath: "/settings" }],
    ["/JA/settings", { locale: "ja", restPath: "/settings" }],
    ["/settings", { locale: null, restPath: "/settings" }],
    ["", { locale: null, restPath: "/" }],
  ] as const)("splits locale path %j", (pathname, expected) => {
    expect(splitLocaleFromPath(pathname)).toEqual(expected);
  });

  it("distinguishes canonical locale casing after case-insensitive parsing", () => {
    expect(hasCanonicalLocalePrefix("/de/settings", "de")).toBe(true);
    expect(hasCanonicalLocalePrefix("/DE/settings", "de")).toBe(false);
  });

  it("uses English paths as aliases independently of the default locale", () => {
    expect(getRouteAliases("/settings", "de")).toHaveLength(0);
    expect(getRouteAliases("/settings", "en")).toHaveLength(0);
    expect(getRouteAliases("/settings", "zh-CN")).toHaveLength(0);
    expect(getRouteAliases("/settings", "ja")).toHaveLength(0);
  });

  it("resolves route keys and localized paths in both directions", () => {
    expect(getRouteKeyForPath("de", "/de/settings")).toBe("/settings");
    expect(getRouteKeyForPath("en", "/en/login")).toBe("/login");
    expect(getRouteKeyForPath("zh-CN", "/zh-CN/settings")).toBe("/settings");
    expect(getRouteKeyForPath("zh-CN", "/zh-CN/login")).toBe("/login");
    expect(getRouteKeyForPath("zh-CN", "/zh-CN/register")).toBe("/register");
    expect(getRouteKeyForPath("zh-CN", "/zh-CN/test")).toBe("/test");
    expect(getRouteKeyForPath("ja", "/ja/settings")).toBe("/settings");
    expect(getRouteKeyForPath("en", "/en/unknown")).toBeNull();

    expect(resolveLocalizedRestPath("/login", "de")).toBe("/login");
    expect(resolveLocalizedRestPath("/login", "zh-CN")).toBe("/login");
    expect(resolveLocalizedRestPath("/register", "zh-CN")).toBe("/register");
    expect(resolveLocalizedRestPath("/test", "zh-CN")).toBe("/test");
    expect(resolveLocalizedRestPath("/login", "ja")).toBe("/login");
    expect(resolveLocalizedRestPath("/unknown/", "de", "en")).toBe("/unknown");
    expect(resolveLocalizedRestPath("/", "de", "en")).toBe("/");
    expect(getLocalizedLoginPath("de")).toBe("/login");
    expect(getLocalizedLoginPath("zh-CN")).toBe("/login");
    expect(getLocalizedLoginPath("ja")).toBe("/login");

    expect(getRouteMatchForPath("de", "/de/settings")).toEqual({
      routeKey: "/settings",
      isAlias: false,
    });
    expect(resolveLocalizedRestPath("/settings", "de", "de")).toBe("/settings");
  });

  it("normalizes Unicode route segments safely for lookup", () => {
    expect(normalizeRoutePathForLookup("/e\u0301")).toBe("/é");
    expect(normalizeRoutePathForLookup("/broken%E0%A4%A")).toBeNull();
    expect(normalizeRoutePathForLookup("/encoded%2Fseparator")).toBeNull();
    expect(normalizeRoutePathForLookup("/encoded%5Cseparator")).toBeNull();
    expect(normalizeRoutePathForLookup("/encoded%252Fseparator")).toBe(
      "/encoded%2Fseparator",
    );
  });

  it("rejects canonical and alias collisions within a locale", () => {
    expect(() =>
      buildRoutePathLookup([
        {
          locale: "de",
          path: "/konflikt",
          routeKey: "/settings",
          isAlias: false,
        },
        {
          locale: "de",
          path: "/konflikt",
          routeKey: "/login",
          isAlias: true,
        },
      ]),
    ).toThrow(/route collision/i);
  });

  it("detects collisions after Unicode normalization", () => {
    expect(() =>
      buildRoutePathLookup([
        {
          locale: "ar",
          path: "/é",
          routeKey: "/settings",
          isAlias: false,
        },
        {
          locale: "ar",
          path: "/e\u0301",
          routeKey: "/login",
          isAlias: true,
        },
      ]),
    ).toThrow(/route collision/i);
  });

  it("allows the same slug to identify different routes across locales", () => {
    const lookup = buildRoutePathLookup([
      {
        locale: "en",
        path: "/shared",
        routeKey: "/settings",
        isAlias: false,
      },
      {
        locale: "de",
        path: "/shared",
        routeKey: "/login",
        isAlias: false,
      },
    ]);

    expect(lookup.en["/shared"]).toEqual({
      routeKey: "/settings",
      isAlias: false,
    });
    expect(lookup.de["/shared"]).toEqual({
      routeKey: "/login",
      isAlias: false,
    });
  });

  it("uses only supported response locales", () => {
    const germanResponse = {
      headers: new Headers({ "x-next-intl-locale": "de" }),
    } as unknown as NextResponse;
    const invalidResponse = {
      headers: new Headers({ "x-next-intl-locale": "invalid_locale" }),
    } as unknown as NextResponse;

    expect(getCurrentLocaleFromResponse(germanResponse, "en")).toBe("de");
    expect(getCurrentLocaleFromResponse(invalidResponse, "en")).toBe("en");
  });

  it.each([
    ["/", "/de"],
    ["/settings", "/de/settings"],
  ])(
    "builds redirect for %j while preserving request search and hash",
    (localizedRest, expectedPath) => {
      const nextUrl = new URL(
        "https://example.test/en/settings?tab=notifications#mail",
      );
      const request = {
        nextUrl,
        url: "https://example.test/en/settings?stale=1#old",
      } as unknown as NextRequest;

      const redirect = buildRedirectUrl(request, "de", localizedRest);

      expect(redirect.pathname).toBe(expectedPath);
      expect(redirect.search).toBe("?tab=notifications");
      expect(redirect.hash).toBe("#mail");
    },
  );
});
