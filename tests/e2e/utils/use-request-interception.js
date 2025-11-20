function useSharedRequestInterception( handlers ) {
	let requestHandler;

	function start() {
		// eslint-disable-next-line consistent-return
		requestHandler = ( request ) => {
			// Replacement for _allowInterception
			if (
				request.isNavigationRequest() &&
				request.redirectChain().length > 0
			) {
				return request.continue();
			}

			for ( const handler of handlers ) {
				const result = handler( request );

				if ( result === false ) {
					// eslint-disable-next-line consistent-return
					return;
				}
			}

			// Prevent double-handling (Puppeteer v24 strict mode)
			if ( ! request.isInterceptResolutionHandled() ) {
				return request.continue();
			}
		};

		page.on( 'request', requestHandler );
	}

	function stop() {
		if ( requestHandler ) {
			page.removeListener( 'request', requestHandler );
		}
	}

	return { start, stop };
}

export function useRequestInterception( handler ) {
	const interception = useSharedRequestInterception( [ handler ] );
	interception.start();
	return interception.stop;
}

export { useSharedRequestInterception };
