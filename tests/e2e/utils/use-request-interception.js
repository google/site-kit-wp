/**
 * Add a request handler for intercepting requests.
 *
 * @param {Function} callback Function to handle requests.
 * @param {Function} cleanup Function to remove the added handler function.
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
