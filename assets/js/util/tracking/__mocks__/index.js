const mockFunctions = Object.create( null );

export function __setTrackEventMockFn( fn ) {
	mockFunctions.trackEvent = fn;
}

export function trackEvent( ...params ) {
	if ( 'function' === typeof mockFunctions.trackEvent ) {
		mockFunctions.trackEvent.apply( null, params );
	}
}
