/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Set the authentication token used by Site Kit.
 *
 * @param {string} token Access token to set.
 * @returns {*} resolved value from apiFetch promise.
 */
export async function setAuthToken( token = 'test-access-token' ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/auth/access-token',
		method: 'post',
		data: { token },
	} );
}
