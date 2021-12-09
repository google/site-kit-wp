/**
 * Tests for chart utilities.
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
import { isSingleSlice, calculateDifferenceBetweenChartValues } from './chart';

describe( 'isSingleSlice', () => {
	it( 'returns undefined when undefined is passed', () => {
		expect( isSingleSlice( undefined ) ).toBe( undefined );
	} );

	it( 'returns true for a report that has a single row of data', () => {
		const report = [
			{
				data: {
					rows: [
						{
							dimensions: [ 'Referral' ],
							metrics: [
								{
									values: [ '3' ],
								},
								{
									values: [ '7' ],
								},
							],
						},
					],
					totals: [
						{
							values: [ '3' ],
						},
						{
							values: [ '13' ],
						},
					],
				},
			},
		];

		expect( isSingleSlice( report ) ).toBe( true );
	} );

	it( 'returns true for a report that has one row contributing 100% of the total for a given dimension', () => {
		const report = [
			{
				data: {
					rows: [
						{
							dimensions: [ 'Referral' ],
							metrics: [
								{
									values: [ '3' ],
								},
								{
									values: [ '7' ],
								},
							],
						},
						{
							dimensions: [ 'Direct' ],
							metrics: [
								{
									values: [ '0' ],
								},
								{
									values: [ '5' ],
								},
							],
						},
						{
							dimensions: [ 'Social' ],
							metrics: [
								{
									values: [ '0' ],
								},
								{
									values: [ '1' ],
								},
							],
						},
					],
					totals: [
						{
							values: [ '3' ],
						},
						{
							values: [ '13' ],
						},
					],
				},
			},
		];

		expect( isSingleSlice( report ) ).toBe( true );
	} );

	it( 'returns false for a report that has more than a single row of data', () => {
		const report = [
			{
				data: {
					rows: [
						{
							dimensions: [ 'Direct' ],
							metrics: [
								{
									values: [ '995' ],
								},
								{
									values: [ '868' ],
								},
							],
						},
						{
							dimensions: [ 'Organic Search' ],
							metrics: [
								{
									values: [ '492' ],
								},
								{
									values: [ '573' ],
								},
							],
						},
						{
							dimensions: [ 'Referral' ],
							metrics: [
								{
									values: [ '291' ],
								},
								{
									values: [ '279' ],
								},
							],
						},
						{
							dimensions: [ 'Social' ],
							metrics: [
								{
									values: [ '10' ],
								},
								{
									values: [ '4' ],
								},
							],
						},
					],
					totals: [
						{
							values: [ '1788' ],
						},
						{
							values: [ '1724' ],
						},
					],
				},
			},
		];

		expect( isSingleSlice( report ) ).toBe( false );
	} );

	it( 'returns false for a report that does not have one row contributing 100% of the total for a given dimension', () => {
		const report = [
			{
				data: {
					rows: [
						{
							dimensions: [ 'Direct' ],
							metrics: [
								{
									values: [ '995' ],
								},
								{
									values: [ '868' ],
								},
							],
						},
						{
							dimensions: [ 'Organic Search' ],
							metrics: [
								{
									values: [ '492' ],
								},
								{
									values: [ '573' ],
								},
							],
						},
						{
							dimensions: [ 'Referral' ],
							metrics: [
								{
									values: [ '291' ],
								},
								{
									values: [ '279' ],
								},
							],
						},
						{
							dimensions: [ 'Social' ],
							metrics: [
								{
									values: [ '10' ],
								},
								{
									values: [ '4' ],
								},
							],
						},
					],
					totals: [
						{
							values: [ '1788' ],
						},
						{
							values: [ '1724' ],
						},
					],
				},
			},
		];

		expect( isSingleSlice( report ) ).toBe( false );
	} );
} );

describe( 'calculateDifferenceBetweenChartValues', () => {
	const calculateDifferenceBetweenChartValuesTestSet = [
		[ 0, 0, 0 ],
		[ 1, 0, 1 ],
		[ 0, 1, -1 ],
		[ 1, 1, 0 ],
		[ 1.5, 1, 0.5 ],
		[ 1, 2, -0.5 ],
	];

	it.each( calculateDifferenceBetweenChartValuesTestSet )(
		'for currentValue: %p and previousValue: %p, return %p.',
		( currentValue, previousValue, result ) => {
			const difference = calculateDifferenceBetweenChartValues(
				currentValue,
				previousValue
			);
			expect( difference ).toBe( result );
		}
	);
} );
