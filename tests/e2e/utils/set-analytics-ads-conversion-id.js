/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Sets the Analytics 4 Ads conversion ID setting.
 *
 * @since n.e.x.t
 *
 * @param {string} id Ads conversion ID setting (e.g. `AW-12345`).
 * @return {*} Resolved value from `apiFetch` promise.
 */
export async function setAnalyticsAdsConversionID( id ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/analytics/ads-conversion-id',
		method: 'post',
		data: { id },
	} );
}
