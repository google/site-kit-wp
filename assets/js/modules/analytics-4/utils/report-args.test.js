/**
 * Tests for Google Analytics 4 report argument utilities.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	REPORT_ARGS_DATA_FILTERS_KEY,
	REPORT_ARGS_SELECTED_DIMENSION_KEY,
	REPORT_ARGS_SELECTED_METRIC_KEY,
} from '../constants';
import {
	generateReportDetailArgs,
	generateReportFilterArgs,
} from './report-args';

describe( 'generateReportDetailArgs', () => {
	it.each( [
		[
			'details is not a plain object',
			{
				details: null,
				expectedError: 'A valid details object is required.',
			},
		],
		[
			'metric is not a string',
			{
				details: { metric: 123 },
				expectedError: 'A valid metric string is required.',
			},
		],
		[
			'dimension is not a string',
			{
				details: { dimension: 123 },
				expectedError: 'A valid dimension string is required.',
			},
		],
	] )( 'should throw an error when %s', ( _, { details, expectedError } ) => {
		expect( () => {
			generateReportDetailArgs( details );
		} ).toThrow( expectedError );
	} );

	it( 'should return an empty object if details is empty', () => {
		const result = generateReportDetailArgs( {} );
		expect( result ).toEqual( {} );
	} );

	it.each( [
		[
			'only metric is provided',
			{
				details: { metric: 'totalUsers' },
				expectedDetailArgs: {
					[ REPORT_ARGS_SELECTED_METRIC_KEY ]: JSON.stringify( [
						'totalUsers',
					] ),
				},
			},
		],
		[
			'only dimension is provided',
			{
				details: { dimension: 'date' },
				expectedDetailArgs: {
					[ REPORT_ARGS_SELECTED_DIMENSION_KEY ]: JSON.stringify( [
						'date',
					] ),
				},
			},
		],
		[
			'both metric and dimension are provided',
			{
				details: { metric: 'totalUsers', dimension: 'date' },
				expectedDetailArgs: {
					[ REPORT_ARGS_SELECTED_METRIC_KEY ]: JSON.stringify( [
						'totalUsers',
					] ),
					[ REPORT_ARGS_SELECTED_DIMENSION_KEY ]: JSON.stringify( [
						'date',
					] ),
				},
			},
		],
	] )(
		'should return the correct parameters when %s',
		( _, { details, expectedDetailArgs } ) => {
			const result = generateReportDetailArgs( details );
			expect( result ).toEqual( expectedDetailArgs );
		}
	);
} );

describe( 'generateReportFilterArgs', () => {
	it.each( [
		[
			'filters is not a plain object',
			{
				filters: null,
				expectedError: 'A valid filters object is required.',
			},
		],
		[
			'dimension name is not a string',
			{
				filters: { [ Symbol() ]: 'abc' },
				expectedError:
					'A valid set of dimension names and values is required.',
			},
		],
		[
			'dimension value is not a string',
			{
				filters: { date: 123 },
				expectedError:
					'A valid set of dimension names and values is required.',
			},
		],
	] )( 'should throw an error when %s', ( _, { filters, expectedError } ) => {
		expect( () => {
			generateReportFilterArgs( filters );
		} ).toThrow( expectedError );
	} );

	it( 'should return an empty object if filters is empty', () => {
		const result = generateReportFilterArgs( {} );
		expect( result ).toEqual( {} );
	} );

	it( 'should return an object with valid filter parameters when filters are provided', () => {
		const filters = { date: '20230123', deviceCategory: 'Tablet' };
		const result = generateReportFilterArgs( filters );

		const expectedDataFilters = [
			{
				type: 1,
				fieldName: 'date',
				evaluationType: 1,
				expressionList: [ '20230123' ],
				complement: false,
				isCaseSensitive: true,
				expression: '',
			},
			{
				type: 1,
				fieldName: 'deviceCategory',
				evaluationType: 1,
				expressionList: [ 'Tablet' ],
				complement: false,
				isCaseSensitive: true,
				expression: '',
			},
		];

		expect( result ).toEqual( {
			[ REPORT_ARGS_DATA_FILTERS_KEY ]:
				JSON.stringify( expectedDataFilters ),
		} );
	} );
} );
