/**
 * Deletes authentication cookies to sign out the current user.
 */
export async function deleteAuthCookie() {
	const cookies = ( await page.cookies() )
		.filter( ( cookie ) => cookie.name.match( /^wordpress_/ ) )
		.filter( ( cookie ) => cookie.name !== 'wordpress_test_cookie' );
	await page.deleteCookie( ...cookies );
}
