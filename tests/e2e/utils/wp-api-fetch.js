/**
 * Proxies calls to `wp.apiFetch` within the page context.
 *
 * @since 1.0.0
 * @see {@link https://github.com/WordPress/gutenberg/blob/trunk/packages/api-fetch/README.md}
 *
 * @param {Object} options Options object passed to `wp.apiFetch`.
 * @return {*} Resolved value from `apiFetch` promise.
 */
export async function wpApiFetch( options ) {
	try {
		// Wait until apiFetch is available on the client.
		await page.waitForFunction( () => window._e2eApiFetch !== undefined );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			'wpApiFetch failure',
			page.url(),
			JSON.stringify( options ),
			error
		);
		throw error;
	}

	return await page.evaluate( ( pageFetchOptions ) => {
		return window._e2eApiFetch( pageFetchOptions );
	}, options );
}
