/**
 * Internal dependencies
 */
import data from '../';
import { setCache, getCache } from '../cache';

const { invalidateCacheGroup } = data;

const nativeSessionStorage = global.sessionStorage;
const nativeLocalStorage = global.localStorage;

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
		global.sessionStorage = undefined;
		global.localStorage = undefined;

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

		global.googlesitekit.admin.datacache = {};

		global.sessionStorage = nativeSessionStorage;
		global.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		it.each( valuesToTest )( 'sessionStorage', ( keysToSet, args, expectedKeys ) => {
			global.sessionStorage = nativeSessionStorage;
			global.localStorage = undefined;

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

			global.googlesitekit.admin.datacache = {};
			global.sessionStorage.clear();

			global.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		it.each( valuesToTest )( 'localStorage', ( keysToSet, args, expectedKeys ) => {
			global.sessionStorage = undefined;
			global.localStorage = nativeLocalStorage;

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

			global.googlesitekit.admin.datacache = {};
			global.localStorage.clear();

			global.sessionStorage = nativeSessionStorage;
		} );
	}
} );
