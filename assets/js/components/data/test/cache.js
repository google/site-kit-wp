/**
 * Data API: Cache tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import { setCache, getCache, deleteCache } from '../cache';
import { getItem as getItemFromAPICache } from '../../../googlesitekit/api/cache';

const nativeSessionStorage = global.sessionStorage;
const nativeLocalStorage = global.localStorage;

const storagesToTest = [
	[ 'variableStorage', undefined, undefined ],
];

if ( nativeSessionStorage ) {
	storagesToTest.push( [ 'sessionStorage', nativeSessionStorage, undefined ] );
}

if ( nativeLocalStorage ) {
	storagesToTest.push( [ 'nativeLocalStorage', undefined, nativeLocalStorage ] );
}

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
	describe.each( storagesToTest )( '%s', ( storageName, _sessionStorage, _localStorage ) => {
		beforeEach( () => {
			global.sessionStorage = _sessionStorage;
			global.localStorage = _localStorage;
		} );

		afterEach( () => {
			global._googlesitekitLegacyData.admin.datacache = {};
			global.sessionStorage = nativeSessionStorage;
			global.localStorage = nativeLocalStorage;
		} );

		it.each( valuesToTest )( '%s', async ( key, value ) => {
			let result = getCache( key );
			expect( result ).toBeUndefined();

			setCache( key, value );
			result = getCache( key );

			expect( result ).toStrictEqual( value );

			const resultFromAPICache = await getItemFromAPICache( key );
			expect( resultFromAPICache.cacheHit ).toBe( false );
			expect( resultFromAPICache.value ).toBeUndefined();

			deleteCache( key );
			result = getCache( key );

			expect( result ).toBeUndefined();
		} );
	} );
} );
