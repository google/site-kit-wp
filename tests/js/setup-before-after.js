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

afterEach( async () => {
	// In order to catch (most) unhandled promise rejections
	// we need to wait at least one more event cycle.
	// To do this, we need to use real timers temporarily if not already configured.
	const nextTick = () => new Promise( ( resolve ) => setTimeout( resolve ) );
	if ( jest.isMockFunction( setTimeout ) ) {
		jest.useRealTimers();
		await nextTick();
		jest.useFakeTimers();
	} else {
		await nextTick();
	}
	fetchMock.mockReset();
} );
