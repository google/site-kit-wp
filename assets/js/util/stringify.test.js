/**
 * Stringify function tests.
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
import { stringifyObject } from './stringify';

describe( 'stringifyObject', () => {
	it( 'stringifies an object into a stable hash', () => {
		const obj = {
			prop1: 'aValue',
			prop2: 42,
			anotherProp: true,
		};
		expect( stringifyObject( obj ) ).toEqual( '2a54b6fb11c326c94c9e49f56a76d56b' );
	} );

	it( 'stringifies objects with same properties in different order the same way', () => {
		const obj1 = {
			prop1: 'aValue',
			prop2: 42,
			anotherProp: true,
		};
		const obj2 = {
			anotherProp: true,
			prop1: 'aValue',
			prop2: 42,
		};
		expect( stringifyObject( obj2 ) ).toEqual( stringifyObject( obj1 ) );
	} );

	it( 'supports nested objects', () => {
		const obj1 = {
			prop: 42,
			anotherProp: {
				value: '1',
			},
		};
		const obj2 = {
			prop: 42,
			anotherProp: {
				value: '2',
			},
		};
		expect( stringifyObject( obj2 ) ).not.toEqual( stringifyObject( obj1 ) );
	} );
} );
