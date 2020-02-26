/**
 * Internal dependencies
 */
import { purify } from './purify';

export const sanitizeHTML = ( unsafeHTML, domPurifyConfig = {}, _purify = purify ) => {
	return {
		__html: _purify.sanitize( unsafeHTML, domPurifyConfig ),
	};
};
