/**
 * Internal dependencies
 */
import { setCache, deleteCache, getCache } from '../';

const valuesToTest = [
	[
		'localStorage',
		'testKey',
		'testdata',
		'testdata',
		true,
		true
	],
	[
		'sessionStorage',
		'testKey',
		'testdata',
		'testdata',
		true,
		true
	],
	[
		'nonExistantStorage',
		'testKey',
		'testdata',
		undefined,
		undefined,
		undefined
	]
];

describe( 'setCache / deleteCache / getCache', () => {
	it.each( valuesToTest )( 'should handle cache type %s appropriately', ( cacheType, cacheKey, data, expected, deleteExpected, setCacheExpected ) => {

		// Test setCache.
		const setCacheResult = setCache( cacheType, cacheKey, data );
		expect( setCacheResult ).toStrictEqual( setCacheExpected );

		// Test getCache.
		const value = getCache( cacheType, cacheKey );
		expect( value ).toStrictEqual( expected );

		// Test deleteCahe
		const deleteResult = deleteCache( cacheType, cacheKey );
		expect( deleteResult ).toStrictEqual( deleteExpected );
		const afterDeleteValue = getCache( cacheType, cacheKey );
		expect( afterDeleteValue ).toBeFalsy();
	} );
} );
