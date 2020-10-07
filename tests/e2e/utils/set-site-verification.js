/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Sets the site verification state of the current user.
 *
 * @since 1.0.0
 *
 * @param {boolean} verified Whether or not the site should be considered "verified".
 * @return {*} Resolved value from `apiFetch` promise.
 */
export async function setSiteVerification( verified = true ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/setup/site-verification',
		method: 'post',
		data: { verified },
	} );
}
