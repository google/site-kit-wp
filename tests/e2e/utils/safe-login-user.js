/**
 * WordPress dependencies
 */
import { loginUser, isCurrentURL } from '@wordpress/e2e-test-utils';
import { WP_USERNAME, WP_PASSWORD } from '@wordpress/e2e-test-utils/build/shared/config';

const MAX_LOGIN_ATTEMPTS = 3;

/**
 * Attempts to log in the given user up to a maximum number of retries on failure.
 *
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 * @param {?number} attempt Number of the current attempt.
 */
export async function safeLoginUser( username = WP_USERNAME, password = WP_PASSWORD, attempt = 1 ) {
	if ( attempt > MAX_LOGIN_ATTEMPTS ) {
		throw new Error( `Failed to login as ${ username } after ${ attempt } attempts` );
	}

	await loginUser( username, password );

	if ( isCurrentURL( 'wp-login.php' ) ) {
		safeLoginUser( username, password, attempt++ );
	}
}
