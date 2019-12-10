beforeEach( () => {
	localStorage.clear();
	sessionStorage.clear();

	// Clear the mocks for all localStorage/sessionStorage methods.
	[ 'getItem', 'setItem', 'removeItem', 'key' ].forEach( ( method ) => {
		localStorage[ method ].mockClear();
		sessionStorage[ method ].mockClear();
	} );
} );
