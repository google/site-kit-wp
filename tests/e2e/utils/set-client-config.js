/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';
import { testClientConfig } from './test-client-config';

/**
 * Set oAuth client configuration used by Site Kit.
 *
 * @param {Object} [config] Client configuration object.
 * @returns {*} resolved value from apiFetch promise.
 */
export async function setClientConfig( config = testClientConfig ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/auth/client-config',
		method: 'post',
		data: {
			clientID: config.web.client_id,
			clientSecret: config.web.client_secret,
		},
	} );
}
