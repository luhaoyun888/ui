import React from 'react';
import { LOCALE_STORAGE_KEY, localeService } from '@/src/services/api';
import {
  EMBEDDED_DEFAULT_LOCALE,
  EMBEDDED_SUPPORTED_LOCALES,
  getEmbeddedBundle,
  type EmbeddedBundle,
} from '@/src/i18n/embeddedBundles';

type TranslationParams = Record<string, string | number | boolean | null | undefined>;
type BundleSource = 'remote' | 'embedded-fallback';

interface LocaleContextValue {
  locale: string;
  resolvedLocale: string;
  defaultLocale: string;
  supportedLocales: string[];
  loading: boolean;
  bundleSource: BundleSource;
  loadError: string;
  t: (key: string, fallback?: string, params?: TranslationParams) => string;
  setLocale: (nextLocale: string) => Promise<void>;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function getStoredLocale() {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem(LOCALE_STORAGE_KEY) || '';
}

function setStoredLocale(locale: string) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

function getNestedValue(bundle: EmbeddedBundle | null, key: string): string | undefined {
  if (!bundle) {
    return undefined;
  }

  const parts = key.split('.');
  let current: unknown = bundle;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

function isLikelyCorruptedTranslation(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value
    .replace(/\{\{\w+\}\}/g, '')
    .replace(/\s+/g, '');

  if (!normalized) {
    return false;
  }

  if (normalized.includes('\uFFFD')) {
    return true;
  }

  if (/[\uE000-\uF8FF]/.test(normalized)) {
    return true;
  }

  if (
    /鏍稿績|鎻掍欢|绯荤粺|璇█|宸茬櫥褰?|鏃犳硶|褰撳墠|閫€鍑?|鍔犺浇|鏆傛棤|楠岃瘉|杞崲|寮€濮|璁よ瘉|鐢熷懡鍛ㄦ湡/.test(normalized)
  ) {
    return true;
  }

  const questionCount = (normalized.match(/\?/g) || []).length;
  return questionCount >= 2 && questionCount / normalized.length >= 0.25;
}

function getSafeNestedValue(bundle: EmbeddedBundle | null, key: string): string | undefined {
  const value = getNestedValue(bundle, key);
  return isLikelyCorruptedTranslation(value) ? undefined : value;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function mergeBundles(baseBundle: EmbeddedBundle, overrideBundle?: EmbeddedBundle | null): EmbeddedBundle {
  if (!overrideBundle) {
    return baseBundle;
  }

  const result: Record<string, unknown> = { ...baseBundle };
  for (const [key, value] of Object.entries(overrideBundle)) {
    const baseValue = result[key];
    if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && baseValue
      && typeof baseValue === 'object'
      && !Array.isArray(baseValue)
    ) {
      result[key] = mergeBundles(baseValue as EmbeddedBundle, value as EmbeddedBundle);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function sanitizeBundle(bundle?: EmbeddedBundle | null): EmbeddedBundle | null {
  if (!bundle) {
    return null;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (typeof value === 'string') {
      if (!isLikelyCorruptedTranslation(value)) {
        result[key] = value;
      }
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (value && typeof value === 'object') {
      result[key] = sanitizeBundle(value as EmbeddedBundle);
      continue;
    }

    result[key] = value;
  }

  return result as EmbeddedBundle;
}

function normalizeLocale(locale: string) {
  if (!locale) {
    return EMBEDDED_DEFAULT_LOCALE;
  }
  if (EMBEDDED_SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }
  return EMBEDDED_DEFAULT_LOCALE;
}

function formatLocaleError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error || '');
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const initialLocale = normalizeLocale(getStoredLocale() || EMBEDDED_DEFAULT_LOCALE);
  const [locale, setLocaleState] = React.useState(initialLocale);
  const [resolvedLocale, setResolvedLocale] = React.useState(initialLocale);
  const [defaultLocale, setDefaultLocale] = React.useState(EMBEDDED_DEFAULT_LOCALE);
  const [supportedLocales, setSupportedLocales] = React.useState<string[]>([...EMBEDDED_SUPPORTED_LOCALES]);
  const [bundle, setBundle] = React.useState<EmbeddedBundle | null>(getEmbeddedBundle(initialLocale));
  const [defaultBundle, setDefaultBundle] = React.useState<EmbeddedBundle | null>(getEmbeddedBundle(EMBEDDED_DEFAULT_LOCALE));
  const [loading, setLoading] = React.useState(false);
  const [bundleSource, setBundleSource] = React.useState<BundleSource>('embedded-fallback');
  const [loadError, setLoadError] = React.useState('');

  const applyEmbeddedLocale = React.useCallback((preferredLocale: string, errorMessage = '') => {
    const normalizedLocale = normalizeLocale(preferredLocale);
    setLocaleState(normalizedLocale);
    setResolvedLocale(normalizedLocale);
    setDefaultLocale(EMBEDDED_DEFAULT_LOCALE);
    setSupportedLocales([...EMBEDDED_SUPPORTED_LOCALES]);
    setBundle(getEmbeddedBundle(normalizedLocale));
    setDefaultBundle(getEmbeddedBundle(EMBEDDED_DEFAULT_LOCALE));
    setBundleSource('embedded-fallback');
    setLoadError(errorMessage);
    setStoredLocale(normalizedLocale);
  }, []);

  const loadLocale = React.useCallback(async (preferredLocale?: string) => {
    const requestedLocale = normalizeLocale(preferredLocale || getStoredLocale() || locale || EMBEDDED_DEFAULT_LOCALE);
    setLoading(true);
    setStoredLocale(requestedLocale);

    try {
      const config = await localeService.getClientConfig();
      const nextDefaultLocale = normalizeLocale(config.default_locale || EMBEDDED_DEFAULT_LOCALE);
      const nextResolvedLocale = normalizeLocale(config.resolved_locale || requestedLocale || nextDefaultLocale);
      const nextSupportedLocales = (config.supported_locales || [])
        .filter((item) => EMBEDDED_SUPPORTED_LOCALES.includes(item));

      const [resolvedBundleResponse, defaultBundleResponse] = await Promise.all([
        localeService.getClientBundle(nextResolvedLocale),
        nextResolvedLocale === nextDefaultLocale
          ? Promise.resolve(null)
          : localeService.getClientBundle(nextDefaultLocale),
      ]);

      const sanitizedResolvedBundle = sanitizeBundle(resolvedBundleResponse.bundle as EmbeddedBundle);
      const sanitizedDefaultBundle = sanitizeBundle(
        (defaultBundleResponse?.bundle as EmbeddedBundle)
          || (resolvedBundleResponse.bundle as EmbeddedBundle),
      );

      setLocaleState(requestedLocale);
      setResolvedLocale(nextResolvedLocale);
      setDefaultLocale(nextDefaultLocale);
      setSupportedLocales(nextSupportedLocales.length ? nextSupportedLocales : [...EMBEDDED_SUPPORTED_LOCALES]);
      setBundle(mergeBundles(getEmbeddedBundle(nextResolvedLocale), sanitizedResolvedBundle));
      setDefaultBundle(
        mergeBundles(
          getEmbeddedBundle(nextDefaultLocale),
          sanitizedDefaultBundle,
        ),
      );
      setBundleSource('remote');
      setLoadError('');
      setStoredLocale(nextResolvedLocale);
    } catch (error) {
      const message = formatLocaleError(error);
      applyEmbeddedLocale(requestedLocale, message);
      if (import.meta.env.DEV) {
        console.warn('[i18n] remote bundle unavailable, using embedded fallback', {
          requestedLocale,
          error: message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [applyEmbeddedLocale, locale]);

  React.useEffect(() => {
    void loadLocale(getStoredLocale() || initialLocale);
  }, [loadLocale]);

  const t = React.useCallback((key: string, fallback = key, params?: TranslationParams) => {
    const template = getSafeNestedValue(bundle, key) ?? getSafeNestedValue(defaultBundle, key) ?? fallback;
    return interpolate(template, params);
  }, [bundle, defaultBundle]);

  const setLocale = React.useCallback(async (nextLocale: string) => {
    if (!nextLocale) {
      return;
    }
    applyEmbeddedLocale(nextLocale);
    await loadLocale(nextLocale);
  }, [applyEmbeddedLocale, loadLocale]);

  const value = React.useMemo<LocaleContextValue>(() => ({
    locale,
    resolvedLocale,
    defaultLocale,
    supportedLocales,
    loading,
    bundleSource,
    loadError,
    t,
    setLocale,
  }), [bundleSource, defaultLocale, loadError, loading, locale, resolvedLocale, setLocale, supportedLocales, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
