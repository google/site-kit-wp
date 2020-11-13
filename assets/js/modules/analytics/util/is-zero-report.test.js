/**
 * Tests for report utilities.
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
 * Internal dependencies.
 */
import { isZeroReport } from './is-zero-report';

describe( 'isZeroReport', () => {
	it( 'should return undefined when a undefined is passed', () => {
		expect( isZeroReport( undefined ) ).toBe( undefined );
	} );

	it.each( [
		[ 'NULL', null ],
		[ 'FALSE', false ],
		[ 'a number', 1 ],
		[ 'a string', 'test' ],
		[ 'an empty object', {} ],
		[ 'an object without rows or totals', [ { data: {} } ] ],
		[ 'an object with empty rows', [ { data: { rows: [] } } ] ],
		[ 'an object with empty totals', [ { data: { totals: [] } } ] ],
	] )( 'should return TRUE when %s is passed', ( _, report ) => {
		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'should return TRUE none of the values in totals are greater than 0', () => {
		const report = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'0',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'should return FALSE when a valid object is passed', () => {
		const report = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'928',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( report ) ).toBe( false );
	} );
} );

