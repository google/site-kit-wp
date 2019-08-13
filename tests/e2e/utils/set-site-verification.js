
import { wpApiFetch } from './wp-api-fetch';

/**
 *
 * @param {*} config
 */
export async function setSiteVerification( verified = true ) {
	return await wpApiFetch( {
		path: 'google-site-kit/v1/e2e/setup/site-verification',
		method: 'post',
		data: { verified },
	} );
}
