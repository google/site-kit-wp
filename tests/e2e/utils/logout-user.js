/**
 * WordPress dependencies
 */
import { createURL, isCurrentURL } from '@wordpress/e2e-test-utils';

/**
 * Log out the current user.
 */
export async function logoutUser() {
	const cookies = ( await page.cookies() )
		.filter( ( cookie ) => cookie.name.match( /^wordpress_/ ) )
		.filter( ( cookie ) => cookie.name !== 'wordpress_test_cookie' );
	await page.deleteCookie( ...cookies );

	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto(
			createURL( 'wp-login.php' )
		);
	}
}
