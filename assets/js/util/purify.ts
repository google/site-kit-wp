/**
 * External dependencies
 */
import createDOMPurify from 'dompurify';

export const purify = createDOMPurify(
	global as unknown as Window & typeof globalThis
);
