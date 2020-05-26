/**
 * Fetch markup for any given URL in the context of Puppateer
 *
 * @param {string} url     Page URI to retrieve the content for.
 * @param {Object} options Options object to be passed to fetch()
 */
export async function fetchPageContent( url, options = {} ) {
	try {
		// Wait until apiFetch is available on the client.
		await page.waitForFunction( () => window.fetch !== undefined );
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.warn( 'fetchPageContent failure', page.url(), JSON.stringify( options ) );
		throw e;
	}

	return await page.evaluate( ( fetchURL, fetchOptions ) => {
		return window.fetch( fetchURL, fetchOptions ).then( ( res ) => res.text() );
	}, url, options );
}
