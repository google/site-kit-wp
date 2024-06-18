/**
 * Tests for  * Analytics 4 pivot reporting API validation utilities.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isValidPivotsObject } from './report-pivots-validation';

describe( 'Analytics 4 Pivot Report API validation', () => {
	describe( 'isValidPivotsObject', () => {
		it.each( [
			[
				true,
				'an array of valid pivot objects is passed',
				[
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 3,
					},
					{
						fieldNames: [
							'audienceResourceName',
							'operatingSystem',
						],
						limit: 5,
					},
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 3,
					},
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 3,
						orderby: [
							{
								metric: {
									metricName: 'totalUsers',
								},
								desc: true,
							},
						],
					},
				],
			],
			[ false, 'an array is not passed (null)', null ],
			[ false, 'an array is not passed (string)', 'test' ],

			[ false, 'an array is not passed (object)', { test: 123 } ],
			[ false, 'a non-object is passed in the array (null)', [ null ] ],
			[
				false,
				'a non-object is passed in the array (string)',
				[ 'test' ],
			],
			[
				false,
				'a pivot object is missing the fieldNames property',
				[
					{
						limit: 3,
					},
				],
			],
			[
				false,
				'a pivot object has a non-array fieldNames property (null)',
				[
					{
						fieldNames: 'test',
					},
				],
			],
			[
				false,
				'a pivot object has a non-array fieldNames property (string)',
				[
					{
						fieldNames: 'test',
					},
				],
			],
			[
				false,
				'a pivot object has an empty fieldNames array',
				[
					{
						fieldNames: [],
					},
				],
			],
			[
				false,
				'a pivot object is missing the limit property',
				[
					{
						fieldNames: [ 'audienceResourceName' ],
					},
				],
			],
			[
				false,
				'a pivot object has an invalid limit definition (null)',
				[
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: null,
					},
				],
			],
			[
				false,
				'a pivot object has an invalid limit definition (string)',
				[
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 'test',
					},
				],
			],
			[
				false,
				'a pivot object has an invalid order definition',
				[
					{
						fieldNames: [ 'audienceResourceName' ],
						limit: 3,
						orderby: [
							{
								test: 123,
							},
						],
					},
				],
			],
		] )(
			'should return %s if %s',
			( expectedResult, testDescription, pivots ) => {
				expect( isValidPivotsObject( pivots ) ).toBe( expectedResult );
			}
		);
	} );
} );
