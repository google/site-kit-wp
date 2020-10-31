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
 * Takes a string, removes the trailing stash if any and returns it.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string} string A string with or without trailing slash.
 * @return {string|null} The string after removing the trailing slash.
 */
export const untrailingslashit = ( string ) => string?.replace?.( /\/+$/, '' );
