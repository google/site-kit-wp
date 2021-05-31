/**
 * Adds a request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with a custom handler function.
 * Returns a function that, when called, stops further request
 * handling/interception.
 *
 * @since 1.0.0
 *
 * @param {Function} callback Function to handle requests.
 * @return {Function} Function that can be called to remove the added handler function from the page.
 */
export function useRequestInterception( callback ) {
	const requestHandler = ( request ) => {
		// Prevent errors for requests that happen after interception is disabled.
		if ( ! request._allowInterception ) {
			return;
		}

		if ( request.url().match( 'google-site-kit/v1/modules/search-console/data/searchanalytics' ) ) {
			/* if try and do this everywhere then get this error
			  Error: Element .googlesitekit-cta-link (text: "/Set up PageSpeed Insights/i") not found
				JSHandles can be evaluated only in the context they were created!

				JSHandles can be evaluated only in the context they were created!
			*/
			// request.respond( { status: 200, body: JSON.stringify( {} ) } );
		}

		callback( request );
	};

	page.on( 'request', requestHandler );

	return () => {
		page.off( 'request', requestHandler );
	};
}
