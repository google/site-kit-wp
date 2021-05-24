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
import { STORE_NAME } from './constants';
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
					registry.dispatch( STORE_NAME ).setDateRange();
				} ).toThrow( 'Date range slug is required.' );
			} );

			it( 'should set the date range', () => {
				const someDateRange = 'last-14-days';

				registry.dispatch( STORE_NAME ).setDateRange( someDateRange );
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( someDateRange );
			} );
		} );

		describe( 'setReferenceDate', () => {
			it( 'should require the date string param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setReferenceDate();
				} ).toThrow( 'Date string is required.' );
			} );

			it( 'should set the reference date', () => {
				const someReferenceDate = '2020-09-12';

				registry.dispatch( STORE_NAME ).setReferenceDate( someReferenceDate );
				expect( registry.stores[ STORE_NAME ].store.getState().referenceDate ).toEqual( someReferenceDate );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDateRange', () => {
			it( 'should return the date range once set', () => {
				const someDateRange = 'last-7-days';

				registry.dispatch( STORE_NAME ).setDateRange( someDateRange );
				expect( registry.select( STORE_NAME ).getDateRange() )
					.toEqual( someDateRange );
			} );

			it( 'should return "last-28-days" when no date range is set', () => {
				expect( registry.select( STORE_NAME ).getDateRange() )
					.toEqual( 'last-28-days' );
			} );
		} );

		describe( 'getDateRangeDates', () => {
			// referenceDate is passed to allow for static date testing
			const options = { referenceDate: '2020-09-24' };

			const createDateRangeTest = ( dateRange, expected, additionalOptions = {} ) => {
				registry.dispatch( STORE_NAME ).setDateRange( dateRange );
				expect( registry.select( STORE_NAME ).getDateRangeDates( { ...options, ...additionalOptions } ) )
					.toEqual( expected );
			};

			describe( 'with date range', () => {
				// [ dateRange, expectedReturnDates ]
				const valuesToTest = [
					[ 'last-1-days', { startDate: '2020-09-24', endDate: '2020-09-24' } ],
					[ 'last-7-days', { startDate: '2020-09-18', endDate: '2020-09-24' } ],
					[ 'last-365-days', { startDate: '2019-09-26', endDate: '2020-09-24' } ],
				];

				it.each( valuesToTest )( 'should return proper dates for "%s"', ( dateRange, expected ) => {
					createDateRangeTest( dateRange, expected );
				} );
			} );

			describe( 'with date range & offset', () => {
				// [ dateRange, offsetDays, expectedReturnDates ]
				const valuesToTest = [
					[ 'last-1-days', 0, { startDate: '2020-09-24', endDate: '2020-09-24' } ],
					[ 'last-7-days', 0, { startDate: '2020-09-18', endDate: '2020-09-24' } ],
					[ 'last-30-days', 0, { startDate: '2020-08-26', endDate: '2020-09-24' } ],
					[ 'last-1-days', 3, { startDate: '2020-09-21', endDate: '2020-09-21' } ],
					[ 'last-7-days', 3, { startDate: '2020-09-15', endDate: '2020-09-21' } ],
					[ 'last-30-days', 3, { startDate: '2020-08-23', endDate: '2020-09-21' } ],
				];

				const testName = 'should return proper dates for "%s" & offsetDays %s';
				it.each( valuesToTest )( testName, ( dateRange, offsetDays, expected ) => {
					createDateRangeTest( dateRange, expected, { offsetDays } );
				} );
			} );

			describe( 'with date range, offset, & compare', () => {
				// [ dateRange, offsetDays, expectedReturnDates ]
				const valuesToTest = [
					[ 'last-1-days', 0, {
						startDate: '2020-09-24',
						endDate: '2020-09-24',
						compareStartDate: '2020-09-23',
						compareEndDate: '2020-09-23',
					} ],
					[ 'last-7-days', 0, {
						startDate: '2020-09-18',
						endDate: '2020-09-24',
						compareStartDate: '2020-09-11',
						compareEndDate: '2020-09-17',
					} ],
					[ 'last-30-days', 0, {
						startDate: '2020-08-26',
						endDate: '2020-09-24',
						compareStartDate: '2020-07-27',
						compareEndDate: '2020-08-25',
					} ],
					[ 'last-1-days', 3, {
						startDate: '2020-09-21',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-20',
						compareEndDate: '2020-09-20',
					} ],
					[ 'last-7-days', 3, {
						startDate: '2020-09-15',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-08',
						compareEndDate: '2020-09-14',
					} ],
					[ 'last-30-days', 3, {
						startDate: '2020-08-23',
						endDate: '2020-09-21',
						compareStartDate: '2020-07-24',
						compareEndDate: '2020-08-22',
					} ],
				];

				const testName = 'should return proper dates for "%s" & offsetDays %s, & compare';
				it.each( valuesToTest )( testName, ( dateRange, offsetDays, expected ) => {
					createDateRangeTest( dateRange, expected, { offsetDays, compare: true } );
				} );
			} );

			describe( 'with date range, offset, compare, & weekDayAlign', () => {
				// [ dateRange, offsetDays, expectedReturnDates ]
				const valuesToTest = [
					[ 'last-1-days', 1, {
						startDate: '2020-09-23',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-16',
						compareEndDate: '2020-09-16',
					} ],
					[ 'last-3-days', 1, {
						startDate: '2020-09-21',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-14',
						compareEndDate: '2020-09-16',
					} ],
					[ 'last-7-days', 1, {
						startDate: '2020-09-17',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-10',
						compareEndDate: '2020-09-16',
					} ],
					[ 'last-1-days', 3, {
						startDate: '2020-09-21',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-14',
						compareEndDate: '2020-09-14',
					} ],
					[ 'last-3-days', 3, {
						startDate: '2020-09-19',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-12',
						compareEndDate: '2020-09-14',
					} ],
					[ 'last-7-days', 3, {
						startDate: '2020-09-15',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-08',
						compareEndDate: '2020-09-14',
					} ],
					[ 'last-28-days', 0, {
						startDate: '2020-08-28',
						endDate: '2020-09-24',
						compareStartDate: '2020-07-31',
						compareEndDate: '2020-08-27',
					} ],
					[ 'last-90-days', 0, {
						startDate: '2020-06-27',
						endDate: '2020-09-24',
						compareStartDate: '2020-03-28',
						compareEndDate: '2020-06-25',
					} ],
				];

				const testName = 'should return proper dates for "%s", offsetDays %s, compare, & weekDayAlign';
				it.each( valuesToTest )( testName, ( dateRange, offsetDays, expected ) => {
					createDateRangeTest( dateRange, expected, { offsetDays, compare: true, weekDayAlign: true } );
				} );
			} );
		} );

		describe( 'getDateRangeNumberOfDays', () => {
			const createNumberOfDaysTest = ( dateRange, expectedNumberOfDays ) => {
				registry.dispatch( STORE_NAME ).setDateRange( dateRange );
				expect( registry.select( STORE_NAME ).getDateRangeNumberOfDays() )
					.toEqual( expectedNumberOfDays );
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

				it.each( valuesToTest )( 'should return proper number of days for "%s"', ( dateRange, expectedNumberOfDays ) => {
					createNumberOfDaysTest( dateRange, expectedNumberOfDays );
				} );
			} );
		} );

		describe( 'getReferenceDate', () => {
			it( 'should return the reference date once set', () => {
				const someReferenceDate = '2020-08-04';

				registry.dispatch( STORE_NAME ).setReferenceDate( someReferenceDate );
				expect( registry.select( STORE_NAME ).getReferenceDate() )
					.toEqual( someReferenceDate );
			} );

			it( 'should return current date when no reference date is set', () => {
				expect( registry.select( STORE_NAME ).getReferenceDate() )
					.toEqual( getDateString( new Date() ) );
			} );
		} );
	} );
} );
