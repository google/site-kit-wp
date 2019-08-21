/**
 * Add a request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with a custom handler function.
 * Returns a function that, when called, stops further request
 * handling/interception.
 *
 * @param  {Function} callback Function to handle requests.
 * @return {Function} Function that can be called to remove the added handler function from the page.
 */
export function useRequestInterception( callback ) {
	const requestHandler = ( request ) => {
		// Prevent errors for requests that happen after interception is disabled.
		if ( ! request._allowInterception ) {
			return;
		}

		callback( request );
	};

	page.on( 'request', requestHandler );

	return () => {
		page.off( 'request', requestHandler );
	};
}
