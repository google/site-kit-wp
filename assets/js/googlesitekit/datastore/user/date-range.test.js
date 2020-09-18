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
import { getPreviousDate, getDateString, getPreviousWeekDate } from './utils';

describe( 'core/user date-range', () => {
	const today = getDateString( new Date() );
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
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( someDateRange );
			} );

			it( 'should return "last-28-days" when no date range is set', () => {
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( 'last-28-days' );
			} );
		} );

		describe( 'getDateRangeDates', () => {
			describe( 'with date range', () => {
				it( `should return proper dates for "last-1-day"`, () => {
					const endDate = getPreviousDate( today, 1 );
					const expected = [ endDate, endDate, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME ).getDateRangeDates() ).toEqual( expected );
				} );

				it( `should return proper dates for "last-7-days"`, () => {
					const endDate = getPreviousDate( today, 1 );
					const expected = [ getPreviousDate( endDate, 6 ), endDate, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME ).getDateRangeDates() ).toEqual( expected );
				} );

				it( `should return proper dates for "last-365-days"`, () => {
					const endDate = getPreviousDate( today, 1 );
					const expected = [ getPreviousDate( endDate, 364 ), endDate, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-365-days' );
					expect( registry.select( STORE_NAME ).getDateRangeDates() ).toEqual( expected );
				} );
			} );

			describe( 'with date range & offset', () => {
				it( `should return proper dates for "last-1-day" & offsetDays 0`, () => {
					const expected = [ today, today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-7-days" & offsetDays 0`, () => {
					const expected = [ getPreviousDate( today, 6 ), today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-30-days" & offsetDays 0`, () => {
					const expected = [ getPreviousDate( today, 29 ), today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0 } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-1-day" & offsetDays 3`, () => {
					const date = getPreviousDate( today, 3 );
					const expected = [ date, date, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-7-days" & offsetDays 3`, () => {
					const expected = [ getPreviousDate( today, 9 ), getPreviousDate( today, 3 ), today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-30-days" & offsetDays 3`, () => {
					const expected = [ getPreviousDate( today, 32 ), getPreviousDate( today, 3 ), today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3 } ) )
						.toEqual( expected );
				} );
			} );

			describe( 'with date range, offset, & compare', () => {
				it( `should return proper dates for "last-1-day", offsetDays 0, & compare`, () => {
					const yesterdayString = getPreviousDate( today, 1 );
					const expected = [ yesterdayString, yesterdayString, today, today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-7-days", offsetDays 0, & compare`, () => {
					const expected = [ getPreviousDate( today, 13 ), getPreviousDate( today, 7 ), getPreviousDate( today, 6 ), today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-30-days", offsetDays 0, & compare`, () => {
					const expected = [ getPreviousDate( today, 59 ), getPreviousDate( today, 30 ), getPreviousDate( today, 29 ), today, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 0, compare: true } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-1-day", offsetDays 3, & compare`, () => {
					const date = getPreviousDate( today, 3 );
					const compareDate = getPreviousDate( date, 1 );
					const expected = [ compareDate, compareDate, date, date, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-1-day' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-7-days", offsetDays 3, & compare`, () => {
					const endDate = getPreviousDate( today, 3 );
					const startDate = getPreviousDate( endDate, 6 );
					const compareEndDate = getPreviousDate( startDate, 1 );
					const compareStartDate = getPreviousDate( compareEndDate, 6 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-7-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );

				it( `should return proper dates for "last-30-days", offsetDays 3, & compare`, () => {
					const endDate = getPreviousDate( today, 3 );
					const startDate = getPreviousDate( endDate, 29 );
					const compareEndDate = getPreviousDate( startDate, 1 );
					const compareStartDate = getPreviousDate( compareEndDate, 29 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];
					registry.dispatch( STORE_NAME ).setDateRange( 'last-30-days' );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { offsetDays: 3, compare: true } ) )
						.toEqual( expected );
				} );
			} );

			describe( 'with date range, offset, compare, & weekDayAlign', () => {
				it( 'should return proper dates for "last-1-day", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 1;
					const startDate = getPreviousDate( today, numberOfDays );
					const endDate = getPreviousDate( today, 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-3-days", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 3;
					const startDate = getPreviousDate( today, numberOfDays );
					const endDate = getPreviousDate( today, 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 1 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 7;
					const startDate = getPreviousDate( today, numberOfDays );
					const endDate = getPreviousDate( today, 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-1-day", offsetDays 3 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 1;
					const endDate = getPreviousDate( today, 3 );
					const startDate = getPreviousDate( endDate, numberOfDays - 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-3-days", offsetDays 3 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 3;
					const endDate = getPreviousDate( today, 3 );
					const startDate = getPreviousDate( endDate, numberOfDays - 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );

				it( 'should return proper dates for "last-7-days", offsetDays 3 (default), compare, & weekDayAlign', () => {
					const numberOfDays = 7;
					const endDate = getPreviousDate( today, 3 );
					const startDate = getPreviousDate( endDate, numberOfDays - 1 );
					const compareEndDate = getPreviousWeekDate( endDate, numberOfDays );
					const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
					const expected = [ compareStartDate, compareEndDate, startDate, endDate, today ];

					registry.dispatch( STORE_NAME ).setDateRange( `last-${ numberOfDays }-days` );
					expect( registry.select( STORE_NAME )
						.getDateRangeDates( { compare: true, weekDayAlign: true, offsetDays: 3 } ) )
						.toEqual( expected );
				} );
			} );
		} );
	} );
} );
