import fetchMockJest from 'fetch-mock-jest';

// Set fetchMock global so we don't have to import fetchMock in every test.
// This global is instantiated in tests/js/setup-globals.js.
// It is re-set here since fetch-mock-jest must be imported during Jest's `setupFilesAfterEnv` or later.
global.fetchMock = fetchMockJest;

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
} );

afterEach( () => {
	fetchMock.mockReset();
} );
