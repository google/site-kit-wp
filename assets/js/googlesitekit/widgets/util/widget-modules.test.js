/**
 * Widget's modules utility tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { normalizeWidgetModules } from './widget-modules';

describe( 'normalizeWidgetModules', () => {
	it.each( [
		[ 'undefined', undefined ],
		[ 'an int', 10 ],
		[ 'a boolean', true ],
		[ 'a float', 1.0 ],
		[ 'a function', () => {} ],
		[ 'an object', {} ],
		[ 'an empty string', '' ],
		[ 'an empty array', [] ],
	] )( 'should return an empty array for %s', ( _, modules ) => {
		expect( normalizeWidgetModules( modules ) ).toHaveLength( 0 );
	} );

	it( 'should return an array of strings when a single string is provided', () => {
		const modules = normalizeWidgetModules( 'analytics-4' );
		expect( modules ).toHaveLength( 1 );
		expect( modules[ 0 ] ).toBe( 'analytics-4' );
	} );

	it( 'should return an array with non empty modules', () => {
		const modules = normalizeWidgetModules( [
			'analytics-4',
			'',
			false,
			'tag-manager',
		] );
		expect( modules ).toHaveLength( 2 );
		expect( modules[ 0 ] ).toBe( 'analytics-4' );
		expect( modules[ 1 ] ).toBe( 'tag-manager' );
	} );
} );
