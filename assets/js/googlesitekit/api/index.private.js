/**
 * External dependencies
 */
import md5 from 'md5';

/**
 * Internal dependencies
 */
import { sortObjectProperties } from 'assets/js/util';

const KEY_SEPARATOR = '::';

/**
 * Create a cache key for a set of type/identifier/datapoint values.
 *
 * @param {string} type        The data to access. One of 'core' or 'modules'.
 * @param {string} identifier  The data identifier, eg. a module slug like `'search-console'`.
 * @param {string} datapoint   The endpoint to request data from.
 * @param {Object} queryParams Query params to send with the request.
 *
 * @return {string} The cache key to use for this set of values.
 */
export const createCacheKey = ( type, identifier, datapoint, queryParams = {} ) => {
	const keySections = [ type, identifier, datapoint ].filter( ( keySection ) => {
		return !! keySection && keySection.length;
	} );

	if (
		keySections.length === 3 &&
    ( !! queryParams ) && ( queryParams.constructor === Object ) &&
    Object.keys( queryParams ).length
	) {
		keySections.push(
			md5( JSON.stringify( sortObjectProperties( queryParams ) ) )
		);
	}

	return keySections.join( KEY_SEPARATOR );
};
