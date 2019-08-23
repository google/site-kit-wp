
/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Set the property ID to render on the site, outside of Site Kit.
 *
 * @param {string} id Analytics property ID (e.g. UA-00000000-1).
 * @return {*} resolved value from apiFetch promise.
 */
export async function setAnalyticsExistingPropertyId( id ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/analytics/existing-property-id',
		method: 'post',
		data: { id },
	} );
}
