/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import { _setStorageKeyPrefix } from 'assets/js/googlesitekit/api/cache';

beforeAll( () => {
	// Make it easier to test localStorage keys directly.
	_setStorageKeyPrefix( '' );
} );

beforeEach( () => {
	localStorage.clear();
	sessionStorage.clear();

	// Clear the mocks for all localStorage/sessionStorage methods.
	[ 'getItem', 'setItem', 'removeItem', 'key' ].forEach( ( method ) => {
		localStorage[ method ].mockClear();
		sessionStorage[ method ].mockClear();
	} );
} );
