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

		callback( request );
	};

	page.on( 'request', requestHandler );

	return () => {
		page.off( 'request', requestHandler );
	};
}

// TODO: Remove this function and it's usages as part of #6433.
/**
 * Adds shared request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with a custom handler function.
 * Returns a function that, when called, stops further request
 * handling/interception.
 *
 * @since 1.93.0
 *
 * @param {Array.<{isMatch: Function, getResponse: Function}>} requestCases An array of request cases to add to the shared request interception.
 * @return {Object} Methods that can be called to remove the added handler function from the page and add new request cases.
 */
export function useSharedRequestInterception( requestCases ) {
	const cases = [ ...requestCases ];
	const requestHandler = ( request ) => {
		// Prevent errors for requests that happen after interception is disabled.
		if ( ! request._allowInterception ) {
			return;
		}

		const requestCase = cases.find( ( { isMatch } ) => {
			return isMatch( request );
		} );

		if ( requestCase ) {
			request.respond( requestCase.getResponse( request ) );
		} else {
			request.continue();
		}
	};

	page.on( 'request', requestHandler );

	return {
		cleanUp: () => page.off( 'request', requestHandler ),
		addRequestCases: ( newCases ) => {
			cases.push( ...newCases );
		},
	};
}
