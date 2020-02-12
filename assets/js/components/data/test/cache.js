/**
 * Internal dependencies
 */
import data from '../';

const { setCache, getCache, deleteCache } = data;

const nativeSessionStorage = global.sessionStorage;
const nativeLocalStorage = global.localStorage;

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

		global.sessionStorage = undefined;
		global.localStorage = undefined;

		result = getCache( key );
		expect( result ).toBeUndefined();

		setCache( key, value );
		result = getCache( key );

		expect( result ).toStrictEqual( value );

		deleteCache( key );
		result = getCache( key );

		expect( result ).toBeUndefined();

		global.googlesitekit.admin.datacache = {};

		global.sessionStorage = nativeSessionStorage;
		global.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		it.each( valuesToTest )( 'sessionStorage', ( key, value ) => {
			let result;

			global.sessionStorage = nativeSessionStorage;
			global.localStorage = undefined;

			result = getCache( key );
			expect( result ).toBeUndefined();

			setCache( key, value );
			result = getCache( key );

			expect( result ).toStrictEqual( value );

			deleteCache( key );
			result = getCache( key );

			expect( result ).toBeUndefined();

			global.googlesitekit.admin.datacache = {};
			global.sessionStorage.clear();

			global.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		it.each( valuesToTest )( 'localStorage', ( key, value ) => {
			let result;

			global.sessionStorage = undefined;
			global.localStorage = nativeLocalStorage;

			result = getCache( key );
			expect( result ).toBeUndefined();

			setCache( key, value );
			result = getCache( key );

			expect( result ).toStrictEqual( value );

			deleteCache( key );
			result = getCache( key );

			expect( result ).toBeUndefined();

			global.googlesitekit.admin.datacache = {};
			global.localStorage.clear();

			global.sessionStorage = nativeSessionStorage;
		} );
	}
} );
