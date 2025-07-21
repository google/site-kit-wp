/**
 * Adds a request handler for intercepting requests.
 *
 * Used intercept HTTP requests during tests with either a callback function
 * or a path:response mapping object.
 *
 * @since 1.0.0
 * @since 1.154.0 Added support for path:response mapping object to simplify request handling.
 *
 * @param {Function|Object} config Either a callback function or a path:response mapping object.
 * @return {Function} Function that can be called to remove the added handler function from the page.
 */
export function useRequestInterception( config ) {
	const requestHandler = ( request ) => {
		// Prevent errors for requests that happen after interception is disabled.
		if ( ! request._allowInterception ) {
			return;
		}

		// If config is a function, use the original callback pattern.
		if ( typeof config === 'function' ) {
			config( request );
			return;
		}

		// Find matching path pattern.
		const matchingPath = Object.keys( config ).find( ( pattern ) =>
			request.url().match( pattern )
		);

		if ( matchingPath ) {
			const response = config[ matchingPath ];

			// Handle different response types.
			if ( typeof response === 'function' ) {
				// If response is a function, call it with the request.
				response( request );
			} else if ( response && typeof response === 'object' ) {
				// If response is an object, use it directly.
				request.respond( response );
			} else {
				// If response is invalid, continue the request.
				request.continue();
			}
		} else {
			// No matching path, continue the request.
			request.continue();
		}
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
