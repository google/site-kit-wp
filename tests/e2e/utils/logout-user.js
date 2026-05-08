/**
 * WordPress dependencies
 */
import { createURL, isCurrentURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { deleteAuthCookie } from './delete-auth-cookie';

/**
 * Deletes authentication cookies to sign out the current user.
 */
export async function logoutUser() {
	await deleteAuthCookie();

	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto( createURL( 'wp-login.php' ) );
	}
}
