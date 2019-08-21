/**
 * Proxy calls to wp.apiFetch within the page context.
 *
 * @link https://github.com/WordPress/gutenberg/blob/master/packages/api-fetch/README.md
 * @param {Object} options Options object passed to `wp.apiFetch`. See documentation at: https://github.com/WordPress/gutenberg/blob/master/packages/api-fetch/README.md#options
 * @return {*} resolved value from apiFetch promise.
 */
export async function wpApiFetch( options ) {
	// Wait until apiFetch is available on the client.
	await page.waitForFunction( () => window.wp !== undefined );
	await page.waitForFunction( () => window.wp.apiFetch !== undefined );

	return await page.evaluate( ( pageFetchOptions ) => {
		return window.wp.apiFetch( pageFetchOptions );
	}, options );
}
