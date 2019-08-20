/**
 * Proxy calls to wp.apiFetch within the page context.
 *
 * @link https://github.com/WordPress/gutenberg/blob/master/packages/api-fetch/README.md
 * @return {*} resolved value from apiFetch promise.
 */
export async function wpApiFetch( options ) {
	// Wait until apiFetch is available on the client.
	await page.waitForFunction( () => window.wp !== undefined );
	await page.waitForFunction( () => window.wp.apiFetch !== undefined );

	return await page.evaluate( ( options ) => {
		return window.wp.apiFetch( options );
	}, options );
}
