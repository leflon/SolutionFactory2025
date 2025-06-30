/**
 * Normalize a string by decomposing accented characters, removing diacritics,
 * removing all non-alphanumeric characters, and converting to lowercase.
 * @param str The string to normalize
 * @returns The normalized string
 */
export function normalizeString(str: string) {
	return str
		.normalize('NFD') // Decompose accented characters
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
		.toLowerCase();
}
