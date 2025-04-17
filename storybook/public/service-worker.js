// Add install handler.
self.addEventListener( 'install', ( event ) => {
	// Force activation immediately.
	event.waitUntil( self.skipWaiting() );
} );

// Add activate handler.
self.addEventListener( 'activate', ( event ) => {
	// Take control immediately.
	event.waitUntil( self.clients.claim() );
} );

// Add fetch handler.
self.addEventListener( 'fetch', ( event ) => {
	const url = new URL( event.request.url );

	// Check if this is the Google Sign-In script.
	if (
		url.hostname === 'accounts.google.com' &&
		url.pathname === '/gsi/client'
	) {
		// Create a new URL with the modified language parameter.
		const modifiedURL = new URL( url );
		modifiedURL.searchParams.set( 'hl', 'en' );

		// Create a new request with the modified URL.
		const modifiedRequest = new Request(
			modifiedURL.toString(),
			event.request
		);

		// Fetch the modified request.
		event.respondWith( fetch( modifiedRequest ) );
	} else {
		// For all other requests, let them pass through.
		event.respondWith( fetch( event.request ) );
	}
} );
