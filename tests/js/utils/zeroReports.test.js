/**
 * Zero Reports utility tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { replaceValuesOrRemoveRowForDateRangeInAnalyticsReport } from './zeroReports';
import mockedReportResponse from './../../../assets/js/modules/analytics-4/utils/__fixtures__/mocked-report-multiple-distinct-date-ranges.json';

describe( 'zeroReports', () => {
	describe( 'replaceValuesOrRemoveRowForDateRangeInAnalyticsReport', () => {
		const matchesDateRange = ( data, dateRange ) =>
			data.some( ( value ) => value.value === dateRange );

		it( 'should zero values for date_range_0 when emptyRowBehavior is "zero"', () => {
			// Create a deep copy of the mocked report
			const report = JSON.parse( JSON.stringify( mockedReportResponse ) );
			const result =
				replaceValuesOrRemoveRowForDateRangeInAnalyticsReport(
					report,
					'date_range_0',
					'zero'
				);

			// Expect all rows to be present (10 total)
			expect( result.rows ).toHaveLength( 10 );

			// Check that date_range_0 rows have zeroed metric values
			const dateRangeZero = result.rows.filter( ( row ) =>
				matchesDateRange( row.dimensionValues, 'date_range_0' )
			);

			dateRangeZero.forEach( ( row ) => {
				row.metricValues.forEach( ( metricValue ) => {
					expect( metricValue.value ).toBe( '0' );
				} );
			} );

			// Check that date_range_1 rows are unchanged
			const dateRangeOne = result.rows.filter( ( row ) =>
				matchesDateRange( row.dimensionValues, 'date_range_1' )
			);

			dateRangeOne.forEach( ( row, index ) => {
				const originalRow = report.rows.filter( ( r ) =>
					matchesDateRange( r.dimensionValues, 'date_range_1' )
				)[ index ];

				expect( row.metricValues ).toEqual( originalRow.metricValues );
			} );

			// Check that totals for date_range_0 are zeroed
			const totalDateRangeZero = result.totals.find( ( total ) =>
				total.dimensionValues.some(
					( value ) => value.value === 'date_range_0'
				)
			);

			totalDateRangeZero.metricValues.forEach( ( metricValue ) => {
				expect( metricValue.value ).toBe( '0' );
			} );

			// Check that totals for date_range_1 are unchanged
			const totalDateRangeOne = result.totals.find( ( total ) =>
				matchesDateRange( total.dimensionValues, 'date_range_1' )
			);

			const originalTotalDateRangeOne = report.totals.find( ( total ) =>
				matchesDateRange( total.dimensionValues, 'date_range_1' )
			);

			expect( totalDateRangeOne.metricValues ).toEqual(
				originalTotalDateRangeOne.metricValues
			);
		} );

		it( 'should remove rows for date_range_0 when emptyRowBehavior is "remove"', () => {
			// Create a deep copy of the mocked report
			const report = JSON.parse( JSON.stringify( mockedReportResponse ) );
			const result =
				replaceValuesOrRemoveRowForDateRangeInAnalyticsReport(
					report,
					'date_range_0',
					'remove'
				);

			// Expect only date_range_1 rows to be present (5 rows)
			expect( result.rows ).toHaveLength( 5 );

			// Check that all remaining rows are date_range_1
			result.rows.forEach( ( row ) => {
				expect(
					matchesDateRange( row.dimensionValues, 'date_range_1' )
				).toBe( true );
			} );

			// Check that rowCount is updated
			expect( result.rowCount ).toBe( 5 );

			// Check that only totals for date_range_1 are present
			expect( result.totals ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.totals[ 0 ].dimensionValues,
					'date_range_1'
				)
			).toBe( true );

			// Check that only minimums for date_range_1 are present
			expect( result.minimums ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.minimums[ 0 ].dimensionValues,
					'date_range_1'
				)
			).toBe( true );

			// Check that only maximums for date_range_1 are present
			expect( result.maximums ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.maximums[ 0 ].dimensionValues,
					'date_range_1'
				)
			).toBe( true );
		} );

		it( 'should zero values for date_range_1 when emptyRowBehavior is "zero"', () => {
			// Create a deep copy of the mocked report
			const report = JSON.parse( JSON.stringify( mockedReportResponse ) );
			const result =
				replaceValuesOrRemoveRowForDateRangeInAnalyticsReport(
					report,
					'date_range_1',
					'zero'
				);

			// Expect all rows to be present (10 total)
			expect( result.rows ).toHaveLength( 10 );

			// Check that date_range_1 rows have zeroed metric values
			const dateRangeOne = result.rows.filter( ( row ) =>
				matchesDateRange( row.dimensionValues, 'date_range_1' )
			);

			dateRangeOne.forEach( ( row ) => {
				row.metricValues.forEach( ( metricValue ) => {
					expect( metricValue.value ).toBe( '0' );
				} );
			} );

			// Check that date_range_0 rows are unchanged
			const dateRangeZero = result.rows.filter( ( row ) =>
				matchesDateRange( row.dimensionValues, 'date_range_0' )
			);

			dateRangeZero.forEach( ( row, index ) => {
				const originalRow = report.rows.filter( ( r ) =>
					r.dimensionValues.some(
						( value ) => value.value === 'date_range_0'
					)
				)[ index ];

				expect( row.metricValues ).toEqual( originalRow.metricValues );
			} );

			// Check that totals for date_range_1 are zeroed
			const totalDateRangeOne = result.totals.find( ( total ) =>
				matchesDateRange( total.dimensionValues, 'date_range_1' )
			);

			totalDateRangeOne.metricValues.forEach( ( metricValue ) => {
				expect( metricValue.value ).toBe( '0' );
			} );

			// Check that totals for date_range_0 are unchanged
			const totalDateRangeZero = result.totals.find( ( total ) =>
				matchesDateRange( total.dimensionValues, 'date_range_0' )
			);

			const originalTotalDateRangeZero = report.totals.find( ( total ) =>
				matchesDateRange( total.dimensionValues, 'date_range_0' )
			);

			expect( totalDateRangeZero.metricValues ).toEqual(
				originalTotalDateRangeZero.metricValues
			);
		} );

		it( 'should remove rows for date_range_1 when emptyRowBehavior is "remove"', () => {
			// Create a deep copy of the mocked report
			const report = JSON.parse( JSON.stringify( mockedReportResponse ) );
			const result =
				replaceValuesOrRemoveRowForDateRangeInAnalyticsReport(
					report,
					'date_range_1',
					'remove'
				);

			// Expect only date_range_0 rows to be present (5 rows)
			expect( result.rows ).toHaveLength( 5 );

			// Check that all remaining rows are date_range_0
			result.rows.forEach( ( row ) => {
				expect(
					matchesDateRange( row.dimensionValues, 'date_range_0' )
				).toBe( true );
			} );

			// Check that rowCount is updated
			expect( result.rowCount ).toBe( 5 );

			// Check that only totals for date_range_0 are present
			expect( result.totals ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.totals[ 0 ].dimensionValues,
					'date_range_0'
				)
			).toBe( true );

			// Check that only minimums for date_range_0 are present
			expect( result.minimums ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.minimums[ 0 ].dimensionValues,
					'date_range_0'
				)
			).toBe( true );

			// Check that only maximums for date_range_0 are present
			expect( result.maximums ).toHaveLength( 1 );
			expect(
				matchesDateRange(
					result.maximums[ 0 ].dimensionValues,
					'date_range_0'
				)
			).toBe( true );
		} );
	} );
} );
