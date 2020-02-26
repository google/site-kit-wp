/**
 * Internal dependencies
 */
import { purify } from './purify';

export const sanitizeHTML = ( unsafeHTML, domPurifyConfig = {} ) => {
	return {
		__html: purify.sanitize( unsafeHTML, domPurifyConfig ),
	};
};
