/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Sets the connected search console property.
 *
 * @since 1.0.0
 *
 * @param {string} property Property URL.
 * @return {*} Resolved value from `apiFetch` promise.
 */
export async function setSearchConsoleProperty(
	property = process.env.WP_BASE_URL
) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/setup/search-console-property',
		method: 'post',
		data: { property },
	} );
}
