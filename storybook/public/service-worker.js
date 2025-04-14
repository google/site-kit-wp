// eslint-disable-next-line no-console
console.log( '[SERVICE WORKER] Setting up service worker' );

// Add install handler
self.addEventListener( 'install', ( event ) => {
	// eslint-disable-next-line no-console
	console.log( '[SERVICE WORKER] Installing...' );
	// Force activation immediately
	event.waitUntil( self.skipWaiting() );
} );

// Add activate handler
self.addEventListener( 'activate', ( event ) => {
	// eslint-disable-next-line no-console
	console.log( '[SERVICE WORKER] Activating...' );
	// Take control immediately
	event.waitUntil( self.clients.claim() );
} );

// storybook/public/service-worker.js
self.addEventListener( 'fetch', ( event ) => {
	const url = new URL( event.request.url );

	// eslint-disable-next-line no-console
	console.log( '[SERVICE WORKER] url', url );

	// Check if this is the Google Sign-In script
	if (
		url.hostname === 'accounts.google.com' &&
		url.pathname === '/gsi/client'
	) {
		// Get the language from the URL parameters or default to 'en'
		const language = url.searchParams.get( 'hl' ) || 'en';
		// eslint-disable-next-line no-console
		console.log( '[SERVICE WORKER] found language', language );

		// Create a new URL with the modified language parameter
		const modifiedURL = new URL( url );
		// eslint-disable-next-line no-console
		console.log( '[SERVICE WORKER] overriding language to en' );
		modifiedURL.searchParams.set( 'hl', 'en' );

		// Create a new request with the modified URL
		const modifiedRequest = new Request(
			modifiedURL.toString(),
			event.request
		);

		// Fetch the modified request
		event.respondWith( fetch( modifiedRequest ) );
	} else {
		// For all other requests, let them pass through
		event.respondWith( fetch( event.request ) );
	}
} );
