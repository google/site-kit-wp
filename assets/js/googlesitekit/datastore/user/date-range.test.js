/**
 * `core/user` data store: date-range.
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
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_USER } from './constants';
import { getDateString } from '../../../util/date-range';

describe( 'core/user date-range', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setDateRange', () => {
			it( 'should require the date range slug param', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).setDateRange();
				} ).toThrow( 'Date range slug is required.' );
			} );

			it( 'should set the date range', () => {
				const someDateRange = 'last-14-days';

				registry.dispatch( CORE_USER ).setDateRange( someDateRange );
				expect( registry.select( CORE_USER ).getDateRange() ).toEqual(
					someDateRange
				);
			} );
		} );

		describe( 'setReferenceDate', () => {
			it( 'should require the date string param', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).setReferenceDate();
				} ).toThrow( 'Date string is required.' );
			} );

			it( 'should set the reference date', () => {
				const someReferenceDate = '2020-09-12';

				registry
					.dispatch( CORE_USER )
					.setReferenceDate( someReferenceDate );
				expect(
					registry.stores[ CORE_USER ].store.getState().referenceDate
				).toEqual( someReferenceDate );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDateRange', () => {
			it( 'should return the date range once set', () => {
				const someDateRange = 'last-7-days';

				registry.dispatch( CORE_USER ).setDateRange( someDateRange );
				expect( registry.select( CORE_USER ).getDateRange() ).toEqual(
					someDateRange
				);
			} );

			it( 'should return "last-28-days" when no date range is set', () => {
				expect( registry.select( CORE_USER ).getDateRange() ).toEqual(
					'last-28-days'
				);
			} );
		} );

		describe( 'getDateRangeDates', () => {
			// referenceDate is passed to allow for static date testing
			const options = { referenceDate: '2020-09-24' };

			const createDateRangeTest = (
				dateRange,
				expected,
				additionalOptions = {}
			) => {
				registry.dispatch( CORE_USER ).setDateRange( dateRange );
				expect(
					registry.select( CORE_USER ).getDateRangeDates( {
						...options,
						...additionalOptions,
					} )
				).toEqual( expected );
			};

			describe( 'with date range', () => {
				// [ dateRange, expectedReturnDates ]
				const valuesToTest = [
					[
						'last-1-days',
						{ startDate: '2020-09-24', endDate: '2020-09-24' },
					],
					[
						'last-7-days',
						{ startDate: '2020-09-18', endDate: '2020-09-24' },
					],
					[
						'last-365-days',
						{ startDate: '2019-09-26', endDate: '2020-09-24' },
					],
				];

				it.each( valuesToTest )(
					'should return proper dates for "%s"',
					( dateRange, expected ) => {
						createDateRangeTest( dateRange, expected );
					}
				);
			} );

			describe( 'with date range & offset', () => {
				// [ dateRange, offsetDays, expectedReturnDates ]
				const valuesToTest = [
					[
						'last-1-days',
						0,
						{ startDate: '2020-09-24', endDate: '2020-09-24' },
					],
					[
						'last-7-days',
						0,
						{ startDate: '2020-09-18', endDate: '2020-09-24' },
					],
					[
						'last-30-days',
						0,
						{ startDate: '2020-08-26', endDate: '2020-09-24' },
					],
					[
						'last-1-days',
						3,
						{ startDate: '2020-09-21', endDate: '2020-09-21' },
					],
					[
						'last-7-days',
						3,
						{ startDate: '2020-09-15', endDate: '2020-09-21' },
					],
					[
						'last-30-days',
						3,
						{ startDate: '2020-08-23', endDate: '2020-09-21' },
					],
				];

				const testName =
					'should return proper dates for "%s" & offsetDays %s';
				it.each( valuesToTest )(
					testName,
					( dateRange, offsetDays, expected ) => {
						createDateRangeTest( dateRange, expected, {
							offsetDays,
						} );
					}
				);
			} );

			describe( 'with date range, offset, & compare', () => {
				// [ dateRange, offsetDays, expectedReturnDates ]
				const valuesToTest = [
					[
						'last-1-days',
						0,
						{
							startDate: '2020-09-24',
							endDate: '2020-09-24',
							compareStartDate: '2020-09-23',
							compareEndDate: '2020-09-23',
						},
					],
					[
						'last-7-days',
						0,
						{
							startDate: '2020-09-18',
							endDate: '2020-09-24',
							compareStartDate: '2020-09-11',
							compareEndDate: '2020-09-17',
						},
					],
					[
						'last-30-days',
						0,
						{
							startDate: '2020-08-26',
							endDate: '2020-09-24',
							compareStartDate: '2020-07-27',
							compareEndDate: '2020-08-25',
						},
					],
					[
						'last-1-days',
						3,
						{
							startDate: '2020-09-21',
							endDate: '2020-09-21',
							compareStartDate: '2020-09-20',
							compareEndDate: '2020-09-20',
						},
					],
					[
						'last-7-days',
						3,
						{
							startDate: '2020-09-15',
							endDate: '2020-09-21',
							compareStartDate: '2020-09-08',
							compareEndDate: '2020-09-14',
						},
					],
					[
						'last-30-days',
						3,
						{
							startDate: '2020-08-23',
							endDate: '2020-09-21',
							compareStartDate: '2020-07-24',
							compareEndDate: '2020-08-22',
						},
					],
				];

				const testName =
					'should return proper dates for "%s" & offsetDays %s, & compare';
				it.each( valuesToTest )(
					testName,
					( dateRange, offsetDays, expected ) => {
						createDateRangeTest( dateRange, expected, {
							offsetDays,
							compare: true,
						} );
					}
				);
			} );
		} );

		describe( 'getDateRangeNumberOfDays', () => {
			const createNumberOfDaysTest = (
				dateRange,
				expectedNumberOfDays
			) => {
				registry.dispatch( CORE_USER ).setDateRange( dateRange );
				expect(
					registry.select( CORE_USER ).getDateRangeNumberOfDays()
				).toEqual( expectedNumberOfDays );
			};

			describe( 'with date range', () => {
				// [ dateRange, expectedNumberOfDays ]
				const valuesToTest = [
					[ 'last-1-days', 1 ],
					[ 'last-3-days', 3 ],
					[ 'last-7-days', 7 ],
					[ 'last-1-days', 1 ],
					[ 'last-3-days', 3 ],
					[ 'last-7-days', 7 ],
					[ 'last-28-days', 28 ],
					[ 'last-90-days', 90 ],
				];

				it.each( valuesToTest )(
					'should return proper number of days for "%s"',
					( dateRange, expectedNumberOfDays ) => {
						createNumberOfDaysTest(
							dateRange,
							expectedNumberOfDays
						);
					}
				);
			} );
		} );

		describe( 'getReferenceDate', () => {
			it( 'should return the reference date once set', () => {
				const someReferenceDate = '2020-08-04';

				registry
					.dispatch( CORE_USER )
					.setReferenceDate( someReferenceDate );
				expect(
					registry.select( CORE_USER ).getReferenceDate()
				).toEqual( someReferenceDate );
			} );

			it( 'should return current date when no reference date is set', () => {
				expect(
					registry.select( CORE_USER ).getReferenceDate()
				).toEqual( getDateString( new Date() ) );
			} );

			it( 'should return the reference date defined in global base data when available', () => {
				global._googlesitekitBaseData = {
					referenceDate: '2023-09-01',
				};

				registry = createTestRegistry();

				expect(
					registry.select( CORE_USER ).getReferenceDate()
				).toEqual( '2023-09-01' );
			} );
		} );
	} );
} );
