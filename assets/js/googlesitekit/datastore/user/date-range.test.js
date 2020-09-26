/**
 * core/user data store: date-range.
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
 * Internal dependencies
 */
import { createTestRegistry } from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

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
	} );

	describe( 'selectors', () => {
		describe( 'getDateRange', () => {
			it( 'should return the date range once set', () => {
				const someDateRange = 'last-7-days';

				registry.dispatch( STORE_NAME ).setDateRange( someDateRange );
				expect( registry.select( STORE_NAME )
					.getDateRange() )
					.toEqual( someDateRange );
			} );

			it( 'should return "last-28-days" when no date range is set', () => {
				expect( registry.select( STORE_NAME )
					.getDateRange() )
					.toEqual( 'last-28-days' );
			} );
		} );

		describe( 'getDateRangeDates', () => {
			// referenceDate is passed to allow for static date testing
			const options = { referenceDate: '2020-09-24' };

			describe( 'with date range', () => {
				it( 'should return proper dates for "last-1-day"', () => {
					const expected = { startDate: '2020-09-23', endDate: '2020-09-23' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( options ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days"', () => {
					const expected = { startDate: '2020-09-17', endDate: '2020-09-23' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( options ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-365-days"', () => {
					const expected = { startDate: '2019-09-25', endDate: '2020-09-23' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-365-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( options ) )
						.toEqual( expected );
				} );
			} );

			describe( 'with date range & offset', () => {
				it( 'should return proper dates for "last-1-day" & offsetDays 0', () => {
					const expected = { startDate: '2020-09-24', endDate: '2020-09-24' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days" & offsetDays 0', () => {
					const expected = { startDate: '2020-09-18', endDate: '2020-09-24' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-30-days" & offsetDays 0', () => {
					const expected = { startDate: '2020-08-26', endDate: '2020-09-24' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-1-day" & offsetDays 3', () => {
					const expected = { startDate: '2020-09-21', endDate: '2020-09-21' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days" & offsetDays 3', () => {
					const expected = { startDate: '2020-09-15', endDate: '2020-09-21' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-30-days" & offsetDays 3', () => {
					const expected = { startDate: '2020-08-23', endDate: '2020-09-21' };
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3 } ) )
						.toEqual( expected );
				} );
			} );

			describe( 'with date range, offset, & compare', () => {
				it( 'should return proper dates for "last-1-day", offsetDays 0, & compare', () => {
					const expected = {
						startDate: '2020-09-24',
						endDate: '2020-09-24',
						compareStartDate: '2020-09-23',
						compareEndDate: '2020-09-23',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 0, & compare', () => {
					const expected = {
						startDate: '2020-09-18',
						endDate: '2020-09-24',
						compareStartDate: '2020-09-11',
						compareEndDate: '2020-09-17',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-30-days", offsetDays 0, & compare', () => {
					const expected = {
						startDate: '2020-08-26',
						endDate: '2020-09-24',
						compareStartDate: '2020-07-27',
						compareEndDate: '2020-08-25',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-1-day", offsetDays 3, & compare', () => {
					const expected = {
						startDate: '2020-09-21',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-20',
						compareEndDate: '2020-09-20',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 3, & compare', () => {
					const expected = {
						startDate: '2020-09-15',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-08',
						compareEndDate: '2020-09-14',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-30-days", offsetDays 3, & compare', () => {
					const expected = {
						startDate: '2020-08-23',
						endDate: '2020-09-21',
						compareStartDate: '2020-07-24',
						compareEndDate: '2020-08-22',
					};
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );
			} );

			describe( 'with date range, offset, compare, & weekDayAlign', () => {
				it( 'should return proper dates for "last-1-day", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-23',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-16',
						compareEndDate: '2020-09-16',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-3-days", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-21',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-14',
						compareEndDate: '2020-09-16',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-3-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-17',
						endDate: '2020-09-23',
						compareStartDate: '2020-09-10',
						compareEndDate: '2020-09-16',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-1-day", offsetDays 3, compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-21',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-14',
						compareEndDate: '2020-09-14',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-3-days", offsetDays 3, compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-19',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-12',
						compareEndDate: '2020-09-14',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-3-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 3, compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-09-15',
						endDate: '2020-09-21',
						compareStartDate: '2020-09-08',
						compareEndDate: '2020-09-14',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-28-days", offsetDays 0, compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-08-28',
						endDate: '2020-09-24',
						compareStartDate: '2020-07-31',
						compareEndDate: '2020-08-27',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-28-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true, offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-90-days", offsetDays 0, compare, & weekDayAlign', () => {
					const expected = {
						startDate: '2020-06-27',
						endDate: '2020-09-24',
						compareStartDate: '2020-03-28',
						compareEndDate: '2020-06-25',
					};

					registry.dispatch( STORE_NAME ).setDateRange( 'last-90-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { ...options, compare: true, weekDayAlign: true, offsetDays: 0 } ) )
						.toEqual( expected );
				} );
			} );
		} );
	} );
} );
