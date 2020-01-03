/**
 * WordPress dependencies
 */
import { createURL, isCurrentURL } from '@wordpress/e2e-test-utils';

/**
 * Log out the current user.
 */
export async function logoutUser() {
	const cookies = ( await page.cookies() ).filter( ( cookie ) => cookie.name.match( /^wordpress_/ ) );
	await page.deleteCookie( ...cookies );

	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto(
			createURL( 'wp-login.php' )
		);
	}
}
