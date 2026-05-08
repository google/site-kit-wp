/**
 * Tests for report utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	it( 'returns undefined when undefined is passed', () => {
		expect( isZeroReport( undefined ) ).toBe( undefined );
	} );

	it.each( [
		[ 'NULL', null ],
		[ 'FALSE', false ],
		[ 'a number', 1 ],
		[ 'a string', 'test' ],
		[ 'an empty object', {} ],
		[ 'an empty array', [] ],
	] )( 'returns true when %s is passed', ( _, report ) => {
		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'returns true when all fields in all rows are 0', () => {
		const report = [
			{
				clicks: 0,
				ctr: 0,
				impressions: 0,
				keys: [ '2000-01-01' ],
				position: 0,
			},
			{
				clicks: 0,
				ctr: 0,
				impressions: 0,
				keys: [ '2000-01-01' ],
				position: 0,
			},
		];

		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'returns false when any row has a positive value for any of its fields', () => {
		const report = [
			{
				clicks: 0,
				ctr: 0,
				impressions: 0,
				keys: [ '2000-01-01' ],
				position: 0,
			},
			{
				clicks: 0,
				ctr: 0,
				impressions: 123,
				keys: [ '2000-01-01' ],
				position: 234,
			},
		];

		expect( isZeroReport( report ) ).toBe( false );
	} );
} );
