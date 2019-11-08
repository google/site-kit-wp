/**
 * Internal dependencies
 */
import data from '../';

const { setCache, getCache, invalidateCacheGroup } = data;

const nativeSessionStorage = window.sessionStorage;
const nativeLocalStorage = window.localStorage;

const valuesToTest = [
	[
		[
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		[
			'type',
		],
		[
			'type2::identifier::datapoint',
		],
	],
	[
		[
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		[
			'type',
			'identifier',
		],
		[
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
	],
	[
		[
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		[
			'type',
			'identifier',
			'datapoint',
		],
		[
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
	],
];

describe( 'invalidateCacheGroup', () => {
	it.each( valuesToTest )( 'variableStorage', ( keysToSet, args, expectedKeys ) => {
		window.sessionStorage = undefined;
		window.localStorage = undefined;

		keysToSet.forEach( function( key ) {
			setCache( key, 'value' );
		} );

		invalidateCacheGroup.bind( data )( ...args );

		const result = [];
		keysToSet.forEach( function( key ) {
			const cachedValue = getCache( key );
			if ( 'undefined' !== typeof cachedValue ) {
				result.push( key );
			}
		} );

		expect( result ).toStrictEqual( expectedKeys );

		window.googlesitekit.admin.datacache = {};

		window.sessionStorage = nativeSessionStorage;
		window.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		it.each( valuesToTest )( 'sessionStorage', ( keysToSet, args, expectedKeys ) => {
			window.sessionStorage = nativeSessionStorage;
			window.localStorage = undefined;

			keysToSet.forEach( function( key ) {
				setCache( key, 'value' );
			} );

			invalidateCacheGroup.bind( data )( ...args );

			const result = [];
			keysToSet.forEach( function( key ) {
				const cachedValue = getCache( key );
				if ( 'undefined' !== typeof cachedValue ) {
					result.push( key );
				}
			} );

			expect( result ).toStrictEqual( expectedKeys );

			window.googlesitekit.admin.datacache = {};
			window.sessionStorage.clear();

			window.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		it.each( valuesToTest )( 'localStorage', ( keysToSet, args, expectedKeys ) => {
			window.sessionStorage = undefined;
			window.localStorage = nativeLocalStorage;

			keysToSet.forEach( function( key ) {
				setCache( key, 'value' );
			} );

			invalidateCacheGroup.bind( data )( ...args );

			const result = [];
			keysToSet.forEach( function( key ) {
				const cachedValue = getCache( key );
				if ( 'undefined' !== typeof cachedValue ) {
					result.push( key );
				}
			} );

			expect( result ).toStrictEqual( expectedKeys );

			window.googlesitekit.admin.datacache = {};
			window.localStorage.clear();

			window.sessionStorage = nativeSessionStorage;
		} );
	}
} );
