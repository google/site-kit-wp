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
 * Takes a URL string, removes the trailing stash if any and returns it.
 *
 * @since 1.18.0
 * @private
 *
 * @param {string} url The URL with or without trailing slash.
 * @return {string|null} The URL string after removing the trailing slash.
 */
export const unTrailingSlashIt = ( url ) => {
	if ( typeof url !== 'string' ) {
		return null;
	}

	if ( url.endsWith( '/' ) ) {
		// remove the trailing slash
		return url.slice( 0, -1 );
	}

	return url;
};
