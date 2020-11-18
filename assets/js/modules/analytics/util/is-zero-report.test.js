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
	it( 'returns undefined when undefined is passed', () => {
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
	] )( 'returns true when %s is passed', ( _, report ) => {
		expect( isZeroReport( report ) ).toBe( true );
	} );

	it( 'returns true id all totals are 0', () => {
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
								'0',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( report ) ).toBe( true );

		const reportMultipleItems = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'0',
								'0',
							],
						},
						{
							values: [
								'0',
								'0',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( reportMultipleItems ) ).toBe( true );

		const reportSingleValue = [
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

		expect( isZeroReport( reportSingleValue ) ).toBe( true );
	} );

	it( 'returns false for a report that has data', () => {
		const report = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'123',
								'234',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( report ) ).toBe( false );

		const reportMixed = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'0',
								'123',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( reportMixed ) ).toBe( false );

		const reportMultipleItems = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'123',
								'234',
							],
						},
						{
							values: [
								'0',
								'345',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( reportMultipleItems ) ).toBe( false );

		const reportSingleValue = [
			{
				data: {
					rows: [
						{}, {}, {},
					],
					totals: [
						{
							values: [
								'123',
							],
						},
					],
				},
			},
		];

		expect( isZeroReport( reportSingleValue ) ).toBe( false );
	} );
} );

