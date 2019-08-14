/**
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Set the site verification state of the current user.
 *
 * @param {Boolean} verified
 * @returns {*} resolved value from apiFetch promise
 */
export async function setSiteVerification( verified = true ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/setup/site-verification',
		method: 'post',
		data: { verified },
	} );
}
