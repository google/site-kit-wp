beforeEach( () => {
	global.console.error.mockClear();
	global.console.warn.mockClear();
	global.console.log.mockClear();
	global.console.info.mockClear();
	global.console.debug.mockClear();

	localStorage.clear();
	sessionStorage.clear();

	// Clear the mocks for all localStorage/sessionStorage methods.
	[ 'getItem', 'setItem', 'removeItem', 'key' ].forEach( ( method ) => {
		localStorage[ method ].mockClear();
		sessionStorage[ method ].mockClear();
	} );

	fetch.resetMocks();
} );
