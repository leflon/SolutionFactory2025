import { useLanguage } from '@/components/LanguageProvider';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

export type Language = 'en' | 'fr';
export const LanguageLabels: Record<Language, string> = {
	en: 'English',
	fr: 'Français',
};

// Makes LocaleRecord recursive, accepting infinitely nested entries
type LocaleEntry = string | LocaleRecord;
type LocaleRecord = { [key: string]: LocaleEntry };

const locales: Record<Language, LocaleRecord> = {
	en,
	fr,
};

/**
 * Retrieves a localized string.
 * Supports nested keys, optional placeholder substitution using `{{param}}` syntax,
 * and simple pluralization based on a `count` parameter.
 *
 * If the key does not exist or resolves to a non-string (e.g., a nested object),
 * the original key is returned as a fallback.
 *
 * For pluralization, the translation entry must be an object with `one` and `other` keys.
 * If a `count` parameter is provided and the entry supports plural forms, the function selects:
 * - `one` if `count === 1` or `count === -1`
 * - `other` otherwise (including 0, decimals, and all other numbers)
 *
 * @param key - Dot-separated path to the desired translation entry.
 * Example: `"cart.items"`.
 *
 * @param params - Optional parameters to interpolate into the string.
 * Each `{{param}}` placeholder in the localized string will be replaced with the corresponding value.
 * A special `count` key is used to trigger plural logic if applicable.
 *
 * @returns The resolved and interpolated localized string, or the original key if unresolved.
 *
 * @example
 * // i18n/en.js :
 * //	{
 * //		cart: {
 * //     items: {
 * //       one: "You have {{count}} item",
 * //       other: "You have {{count}} items"
 * //     }
 * //   }
 * // }
 *
 * t("cart.items", { count: 1 });   // "You have 1 item"
 * t("cart.items", { count: 3 });   // "You have 3 items"
 * t("cart.items", { count: 0 });   // "You have 0 items"
 * t("cart.items", { count: 1.5 }); // "You have 1.5 items"
 * t("cart.items", { count: -1 });  // "You have -1 item"
 * t("cart.items", { count: -2 });  // "You have -2 items"
 */
export function t(key: string, params?: Record<string, string | number>) {
	const { lang } = useLanguage();
	const locale = locales[lang];
	let current: LocaleEntry = locale;

	// Get the requested entry, considering nested entries
	const keySplit = key.split('.');
	for (const part of keySplit) {
		console.log(current, part);
		// Cannot iterate over a string, so nesting stops here
		if (typeof current === 'string') break;
		// Cannot iterate over undefined, so nesting stops here
		if (current === undefined) break;
		current = current[part];
	}

	// If the request string is not found, fallback to the key
	if (!current) return key;

	// Considering plurals
	if (typeof current === 'object') {
		// If the current entry is an object but does not feature plural-specific keys,
		// It is an invalid entry, fallback to the key
		if (!('one' in current && 'other' in current)) return key;
		// Similarly, if the count param is not provided in a pluralized entry, fallback to the key
		if (!params || typeof params.count !== 'number') return key;

		current = current[Math.abs(params.count) === 1 ? 'one' : 'other'];
	}
	// Once again, if the current entry is not a string, fallback to the key
	if (typeof current !== 'string') return key;

	// If params are provided, replace placeholders in the string
	current = current.replace(/\{\{(\w+)\}\}/gi, (match, key) => {
		if (params && key in params) {
			return '' + params[key]; // Convert to string
		}
		return match; // If no param is found, keep the string as is.
	});

	return current;
}
