/**
 * Internal dependencies
 */
import data from '../';

const { setCache, getCache, deleteCache } = data;

const nativeSessionStorage = window.sessionStorage;
const nativeLocalStorage = window.localStorage;

const valuesToTest = [
	[
		'stringKey',
		'aString',
	],
	[
		'integerKey',
		33,
	],
	[
		'boolKey',
		true,
	],
	[
		'falsyKey',
		false,
	],
	[
		'anotherFalsyKey',
		null,
	],
	[
		'objectKey',
		{ hello: 'world' },
	],
];

describe( 'setCache/getCache/deleteCache', () => {
	it.each( valuesToTest )( 'variableStorage', ( key, value ) => {
		let result;

		window.sessionStorage = undefined;
		window.localStorage = undefined;

		result = getCache( key );
		expect( result ).toBeUndefined();

		setCache( key, value );
		result = getCache( key );

		expect( result ).toStrictEqual( value );

		deleteCache( key );
		result = getCache( key );

		expect( result ).toBeUndefined();

		window.googlesitekit.admin.datacache = {};

		window.sessionStorage = nativeSessionStorage;
		window.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		it.each( valuesToTest )( 'sessionStorage', ( key, value ) => {
			let result;

			window.sessionStorage = nativeSessionStorage;
			window.localStorage = undefined;

			result = getCache( key );
			expect( result ).toBeUndefined();

			setCache( key, value );
			result = getCache( key );

			expect( result ).toStrictEqual( value );

			deleteCache( key );
			result = getCache( key );

			expect( result ).toBeUndefined();

			window.googlesitekit.admin.datacache = {};
			window.sessionStorage.clear();

			window.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		it.each( valuesToTest )( 'localStorage', ( key, value ) => {
			let result;

			window.sessionStorage = undefined;
			window.localStorage = nativeLocalStorage;

			result = getCache( key );
			expect( result ).toBeUndefined();

			setCache( key, value );
			result = getCache( key );

			expect( result ).toStrictEqual( value );

			deleteCache( key );
			result = getCache( key );

			expect( result ).toBeUndefined();

			window.googlesitekit.admin.datacache = {};
			window.localStorage.clear();

			window.sessionStorage = nativeSessionStorage;
		} );
	}
} );
