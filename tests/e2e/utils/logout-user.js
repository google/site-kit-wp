/**
 * WordPress dependencies
 */
import { createURL, isCurrentURL } from '@wordpress/e2e-test-utils';

/**
 * Log out the current user.
 */
export async function logoutUser() {
	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto(
			createURL( 'wp-login.php', 'action=logout' )
		);
	}

	// Since we're directly navigating to the logout URL,
	// WP will ask for confirmation due to the missing nonce.

	await Promise.all( [
		page.waitForNavigation(),
		expect( page ).toClick( 'a', { text: /log out/i } ),
	] );
}
