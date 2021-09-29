/**
 * Internal dependencies
 */
import { purify } from './purify';

export const sanitizeHTML = ( unsafeHTML, domPurifyConfig = {} ) => {
	return {
		__html: purify.sanitize( unsafeHTML, domPurifyConfig ),
	};
};

/**
 * Takes a string or an URL object, removes the trailing slash if any and returns it.
 *
 * @since 1.20.0
 * @private
 *
 * @param {Object|string} url A string with or without trailing slash or an URL object.
 * @return {string|undefined} The URL string after removing the trailing slash.
 */
export function untrailingslashit( url ) {
	const originalURL = typeof url === 'object' ? url.toString() : url;
	return originalURL?.replace?.( /\/+$/, '' );
}
