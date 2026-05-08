/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Sets the property ID to render on the site, outside of Site Kit.
 *
 * @since 1.0.0
 *
 * @param {string} id Analytics property ID (e.g. `UA-00000000-1`).
 * @return {*} Resolved value from `apiFetch` promise.
 */
export async function setAnalyticsExistingPropertyID( id ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/analytics/existing-property-id',
		method: 'post',
		data: { id },
	} );
}
