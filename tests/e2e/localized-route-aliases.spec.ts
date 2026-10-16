import { expect, test } from "./fixtures/ensureLoggedIn";
import { ensureAppLocale, switchLocaleFromSettings } from "./utils/locale";

test("locale prefixes are redirected to their canonical casing", async ({
  page,
}) => {
  await ensureAppLocale(page, "de");

  const response = await page.goto("/DE/settings?tab=notifications#mail");
  const redirectResponse = await response
    ?.request()
    .redirectedFrom()
    ?.response();

  expect(response?.status()).toBe(200);
  expect(redirectResponse?.status()).toBe(308);
  await expect(page).toHaveURL(/\/de\/settings\?tab=notifications#mail$/);

  await ensureAppLocale(page, "en");
});

test("identical localized slugs do not redirect", async ({ page }) => {
  await ensureAppLocale(page, "de");

  const response = await page.goto("/de/test");

  expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();
  await expect(page).toHaveURL(/\/de\/test$/);

  await ensureAppLocale(page, "en");
});

test("Chinese settings page loads without redirect loop", async ({ page }) => {
  await ensureAppLocale(page, "zh-CN");

  const response = await page.goto("/zh-CN/settings");

  expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();
  await expect(page).toHaveURL(/\/zh-CN\/settings$/);

  await ensureAppLocale(page, "en");
});

test("Japanese settings page loads without redirect loop", async ({ page }) => {
  await ensureAppLocale(page, "ja");

  const response = await page.goto("/ja/settings");

  expect(response?.status()).toBe(200);
  expect(response?.request().redirectedFrom()).toBeNull();
  await expect(page).toHaveURL(/\/ja\/settings$/);

  await ensureAppLocale(page, "en");
});

test("locale prefix casing redirects preserve query and hash", async ({
  page,
}) => {
  await ensureAppLocale(page, "fr");

  const response = await page.goto("/FR/settings?tab=notifications#mail");
  const redirectResponse = await response
    ?.request()
    .redirectedFrom()
    ?.response();

  expect(response?.status()).toBe(200);
  expect(redirectResponse?.status()).toBe(308);
  await expect(page).toHaveURL(/\/fr\/settings\?tab=notifications#mail$/);

  await ensureAppLocale(page, "en");
});

test("document locale metadata follows the active locale", async ({ page }) => {
  await ensureAppLocale(page, "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "inter",
  );
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toMatch(/Inter/i);

  await page.goto("/en/settings");

  await switchLocaleFromSettings(page, "hi");
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-devanagari",
  );

  const hindiFontState = await page.evaluate(async () => {
    await document.fonts.ready;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    return {
      fontFamily,
      supportsHindi:
        primaryFontFamily !== undefined &&
        document.fonts.check(`16px ${primaryFontFamily}`, "हिन्दी"),
    };
  });
  expect(hindiFontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]Devanagari/i);
  expect(hindiFontState.supportsHindi).toBe(true);

  await switchLocaleFromSettings(page, "zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-cjk-sc",
  );

  const chineseFontState = await page.evaluate(async () => {
    await document.fonts.ready;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    return {
      fontFamily,
      supportsSimplifiedChinese:
        primaryFontFamily !== undefined &&
        document.fonts.check(`16px ${primaryFontFamily}`, "简体中文"),
    };
  });
  expect(chineseFontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]SC/i);
  expect(chineseFontState.supportsSimplifiedChinese).toBe(true);

  await switchLocaleFromSettings(page, "ja");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-cjk-jp",
  );

  const japaneseFontState = await page.evaluate(async () => {
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    const loadedFaces =
      primaryFontFamily === undefined
        ? []
        : await document.fonts.load(`16px ${primaryFontFamily}`, "日本語");
    return {
      fontFamily,
      supportsJapanese: loadedFaces.length > 0,
    };
  });
  expect(japaneseFontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]JP/i);
  expect(japaneseFontState.supportsJapanese).toBe(true);

  await switchLocaleFromSettings(page, "ko");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-cjk-kr",
  );

  const koreanFontState = await page.evaluate(async () => {
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    const loadedFaces =
      primaryFontFamily === undefined
        ? []
        : await document.fonts.load(`16px ${primaryFontFamily}`, "한국어");
    return {
      fontFamily,
      supportsKorean: loadedFaces.length > 0,
    };
  });
  expect(koreanFontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]KR/i);
  expect(koreanFontState.supportsKorean).toBe(true);

  await switchLocaleFromSettings(page, "tr");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto",
  );

  const notoFontState = await page.evaluate(async () => {
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    const samples = [
      "Türkçe ğşıİ",
      "Tiếng Việt ăâđêôơư",
      "Українська їієґ",
      "Русский ё",
    ];
    return {
      fontFamily,
      supportsSamples:
        primaryFontFamily === undefined
          ? samples.map(() => false)
          : await Promise.all(
              samples.map(async (sample) => {
                const loadedFaces = await document.fonts.load(
                  `16px ${primaryFontFamily}`,
                  sample,
                );
                return loadedFaces.length > 0;
              }),
            ),
    };
  });
  expect(notoFontState.fontFamily).toMatch(/Noto[_ ]Sans/i);
  expect(notoFontState.supportsSamples).toEqual([true, true, true, true]);

  await switchLocaleFromSettings(page, "he");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-hebrew",
  );

  const hebrewFontState = await page.evaluate(async () => {
    await document.fonts.ready;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    return {
      fontFamily,
      supportsHebrew:
        primaryFontFamily !== undefined &&
        document.fonts.check(`16px ${primaryFontFamily}`, "עברית אבג"),
    };
  });
  expect(hebrewFontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]Hebrew/i);
  expect(hebrewFontState.supportsHebrew).toBe(true);

  await switchLocaleFromSettings(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute(
    "data-font-profile",
    "noto-arabic",
  );

  const fontState = await page.evaluate(async () => {
    await document.fonts.ready;
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const primaryFontFamily = fontFamily.split(",", 1)[0]?.trim();
    return {
      fontFamily,
      supportsArabic:
        primaryFontFamily !== undefined &&
        document.fonts.check(`16px ${primaryFontFamily}`, "العربية"),
    };
  });
  expect(fontState.fontFamily).toMatch(/Noto[_ ]Sans[_ ]Arabic/i);
  expect(fontState.supportsArabic).toBe(true);
});
