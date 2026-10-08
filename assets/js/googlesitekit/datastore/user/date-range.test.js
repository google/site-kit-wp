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
import { getDateString } from '@/js/util';
import { createTestRegistry } from '@tests/js/utils';
import { CORE_USER } from './constants';

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

			it( 'should reject an invalid slug', () => {
				expect( () =>
					registry.dispatch( CORE_USER ).setDateRange( 'invalid' )
				).toThrow( 'Invalid date range' );
			} );

			it( 'should set the date range', () => {
				const someDateRange = 'last-14-days';

				registry.dispatch( CORE_USER ).setDateRange( someDateRange );
				expect(
					registry.select( CORE_USER ).getDateRangeSelection()
				).toEqual( { type: 'preset', slug: someDateRange } );
				expect( registry.select( CORE_USER ).getDateRange() ).toEqual(
					someDateRange
				);
			} );
		} );

		describe( 'setDateRangeSelection', () => {
			beforeEach( () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-07' );
			} );

			it.each( [
				{ type: 'preset', slug: 'last-7-days' },
				{ type: 'preset', slug: 'last-14-days' },
				{ type: 'preset', slug: 'last-28-days' },
				{ type: 'preset', slug: 'last-90-days' },
				{ type: 'calendarMonth', month: '2026-09' },
				{ type: 'calendarMonth', month: '2025-08' },
				{
					type: 'custom',
					startDate: '2025-08-01',
					endDate: '2026-09-07',
				},
				{
					type: 'custom',
					startDate: '2026-09-07',
					endDate: '2026-09-07',
				},
			] )( 'should commit a valid selection %j', async ( selection ) => {
				await registry
					.dispatch( CORE_USER )
					.setDateRangeSelection( selection );
				expect(
					registry.select( CORE_USER ).getDateRangeSelection()
				).toEqual( selection );
			} );

			it.each( [
				undefined,
				null,
				{},
				[],
				'last-28-days',
				{ type: 'invalid' },
				{ type: 'preset' },
				{ type: 'preset', slug: 28 },
				{ type: 'preset', slug: 'invalid-range' },
				{ type: 'calendarMonth' },
				{ type: 'calendarMonth', month: 202609 },
				{ type: 'calendarMonth', month: '2026-9' },
				{ type: 'calendarMonth', month: '2026-09-01' },
				{ type: 'calendarMonth', month: '2026-00' },
				{ type: 'calendarMonth', month: '2026-13' },
				{ type: 'calendarMonth', month: '2025-07' },
				{ type: 'calendarMonth', month: '2026-10' },
				{ type: 'custom' },
				{ type: 'custom', startDate: '2026-08-01' },
				{ type: 'custom', startDate: 1, endDate: '2026-09-07' },
				{
					type: 'custom',
					startDate: '2026-08-1',
					endDate: '2026-09-07',
				},
				{
					type: 'custom',
					startDate: '2026-08-01',
					endDate: '2026-9-07',
				},
				{
					type: 'custom',
					startDate: '2026-02-29',
					endDate: '2026-09-07',
				},
				{
					type: 'custom',
					startDate: '2026-08-01',
					endDate: '2026-08-32',
				},
				{
					type: 'custom',
					startDate: '2026-08-01T00:00:00Z',
					endDate: '2026-09-07',
				},
				{
					type: 'custom',
					startDate: '2026-09-07',
					endDate: '2026-09-06',
				},
				{
					type: 'custom',
					startDate: '2025-07-31',
					endDate: '2026-09-07',
				},
				{
					type: 'custom',
					startDate: '2026-09-07',
					endDate: '2026-09-08',
				},
			] )(
				'should reject an invalid selection %j without changing state',
				async ( selection ) => {
					await expect(
						registry
							.dispatch( CORE_USER )
							.setDateRangeSelection( selection )
					).rejects.toThrow( 'Invalid date range selection.' );
					expect(
						registry.select( CORE_USER ).getDateRangeSelection()
					).toEqual( { type: 'preset', slug: 'last-28-days' } );
				}
			);

			it( 'should accept valid leap days', async () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-01' );
				const selection = {
					type: 'custom',
					startDate: '2024-02-29',
					endDate: '2024-02-29',
				};
				await registry
					.dispatch( CORE_USER )
					.setDateRangeSelection( selection );
				expect(
					registry.select( CORE_USER ).getDateRangeNumberOfDays()
				).toBe( 1 );
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
				expect(
					registry.select( CORE_USER ).getDateRangeSelection()
				).toEqual( { type: 'preset', slug: someDateRange } );
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

			function createDateRangeTest(
				dateRange,
				expected,
				additionalOptions = {}
			) {
				registry.dispatch( CORE_USER ).setDateRange( dateRange );

				expect(
					registry.select( CORE_USER ).getDateRangeDates( {
						...options,
						...additionalOptions,
					} )
				).toEqual( expected );
			}

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

			describe( 'with date range & compare', () => {
				// [ dateRange, expectedReturnDates ]
				const valuesToTest = [
					[
						'last-1-days',
						{
							startDate: '2020-09-24',
							endDate: '2020-09-24',
							compareStartDate: '2020-09-23',
							compareEndDate: '2020-09-23',
						},
					],
					[
						'last-7-days',
						{
							startDate: '2020-09-18',
							endDate: '2020-09-24',
							compareStartDate: '2020-09-11',
							compareEndDate: '2020-09-17',
						},
					],
					[
						'last-30-days',
						{
							startDate: '2020-08-26',
							endDate: '2020-09-24',
							compareStartDate: '2020-07-27',
							compareEndDate: '2020-08-25',
						},
					],
				];

				const testName =
					'should return proper dates for "%s" & compare';

				it.each( valuesToTest )( testName, ( dateRange, expected ) => {
					createDateRangeTest( dateRange, expected, {
						compare: true,
					} );
				} );
			} );
		} );

		describe( 'getDateRangeNumberOfDays', () => {
			function createNumberOfDaysTest( dateRange, expectedNumberOfDays ) {
				registry.dispatch( CORE_USER ).setDateRange( dateRange );
				expect(
					registry.select( CORE_USER ).getDateRangeNumberOfDays()
				).toEqual( expectedNumberOfDays );
			}

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

		describe( 'selection resolution', () => {
			it.each( [
				[
					{ type: 'preset', slug: 'last-28-days' },
					'last-28-days',
					28,
					'2026-08-11',
					'2026-09-07',
					'2026-07-14',
					'2026-08-10',
				],
				[
					{ type: 'calendarMonth', month: '2026-08' },
					'month-2026-08',
					31,
					'2026-08-01',
					'2026-08-31',
					'2026-07-01',
					'2026-07-31',
				],
				[
					{ type: 'calendarMonth', month: '2026-09' },
					'month-2026-09',
					7,
					'2026-09-01',
					'2026-09-07',
					'2026-08-25',
					'2026-08-31',
				],
				[
					{
						type: 'custom',
						startDate: '2026-04-04',
						endDate: '2026-08-04',
					},
					'custom-2026-08-04-last-123-days',
					123,
					'2026-04-04',
					'2026-08-04',
					'2025-12-02',
					'2026-04-03',
				],
				[
					{
						type: 'custom',
						startDate: '2026-09-07',
						endDate: '2026-09-07',
					},
					'custom-2026-09-07-last-1-days',
					1,
					'2026-09-07',
					'2026-09-07',
					'2026-09-06',
					'2026-09-06',
				],
			] )(
				'should resolve %j and its immediately preceding comparison period',
				async (
					selection,
					slug,
					days,
					startDate,
					endDate,
					compareStartDate,
					compareEndDate
				) => {
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( '2026-09-07' );
					await registry
						.dispatch( CORE_USER )
						.setDateRangeSelection( selection );
					const select = registry.select( CORE_USER );
					expect( select.getDateRange() ).toBe( slug );
					expect( select.getDateRangeNumberOfDays() ).toBe( days );
					expect( select.getDateRangeDates() ).toEqual( {
						startDate,
						endDate,
					} );
					expect(
						select.getDateRangeDates( { compare: true } )
					).toEqual( {
						startDate,
						endDate,
						compareStartDate,
						compareEndDate,
					} );
				}
			);

			it.each( [
				[ '2026-10-07', '2026-10-01', '2026-09-24', '2026-09-30' ],
				[ '2026-03-10', '2026-03-04', '2026-02-25', '2026-03-03' ],
			] )(
				'should keep preset and comparison periods at seven calendar days across DST at %s',
				(
					referenceDate,
					startDate,
					compareStartDate,
					compareEndDate
				) => {
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( referenceDate );
					registry
						.dispatch( CORE_USER )
						.setDateRange( 'last-7-days' );
					expect(
						registry.select( CORE_USER ).getDateRangeNumberOfDays()
					).toBe( 7 );
					expect(
						registry
							.select( CORE_USER )
							.getDateRangeDates( { compare: true } )
					).toEqual( {
						startDate,
						endDate: referenceDate,
						compareStartDate,
						compareEndDate,
					} );
				}
			);

			it( 'should clamp a calendar month to an earlier reference date and compare with the preceding day', async () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-07' );
				await registry.dispatch( CORE_USER ).setDateRangeSelection( {
					type: 'calendarMonth',
					month: '2026-09',
				} );

				expect(
					registry.select( CORE_USER ).getDateRangeDates( {
						referenceDate: '2026-08-31',
						compare: true,
					} )
				).toEqual( {
					startDate: '2026-08-31',
					endDate: '2026-08-31',
					compareStartDate: '2026-08-30',
					compareEndDate: '2026-08-30',
				} );
			} );

			it( 'should clamp custom dates to an overridden reference date and compare the shortened range', async () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-07' );
				await registry.dispatch( CORE_USER ).setDateRangeSelection( {
					type: 'custom',
					startDate: '2026-08-04',
					endDate: '2026-08-10',
				} );

				expect(
					registry.select( CORE_USER ).getDateRangeDates( {
						referenceDate: '2026-08-07',
						compare: true,
					} )
				).toEqual( {
					startDate: '2026-08-04',
					endDate: '2026-08-07',
					compareStartDate: '2026-07-31',
					compareEndDate: '2026-08-03',
				} );
			} );

			it( 'should use an overridden reference date to resolve a calendar month', async () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-07' );
				await registry.dispatch( CORE_USER ).setDateRangeSelection( {
					type: 'calendarMonth',
					month: '2026-09',
				} );
				expect(
					registry.select( CORE_USER ).getDateRangeDates( {
						referenceDate: '2026-09-03',
						compare: true,
					} )
				).toEqual( {
					startDate: '2026-09-01',
					endDate: '2026-09-03',
					compareStartDate: '2026-08-29',
					compareEndDate: '2026-08-31',
				} );
			} );
		} );

		describe( 'selectable window', () => {
			it.each( [
				[ '2026-09-07', '2025-08-01' ],
				[ '2026-01-01', '2024-12-01' ],
				[ '2024-02-29', '2023-01-01' ],
			] )(
				'should bound the window at %s',
				( referenceDate, earliestDate ) => {
					registry
						.dispatch( CORE_USER )
						.setReferenceDate( referenceDate );
					expect(
						registry.select( CORE_USER ).getEarliestSelectableDate()
					).toBe( earliestDate );
					expect(
						registry.select( CORE_USER ).getLatestSelectableDate()
					).toBe( referenceDate );
				}
			);

			it( 'should list all fourteen months newest first and update when the reference date changes', () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-07' );
				const select = registry.select( CORE_USER );
				const months = select.getSelectableCalendarMonths();
				expect( months ).toEqual( [
					'2026-09',
					'2026-08',
					'2026-07',
					'2026-06',
					'2026-05',
					'2026-04',
					'2026-03',
					'2026-02',
					'2026-01',
					'2025-12',
					'2025-11',
					'2025-10',
					'2025-09',
					'2025-08',
				] );
				registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-01' );
				expect( select.getSelectableCalendarMonths() ).toEqual( [
					'2026-10',
					...months.slice( 0, -1 ),
				] );
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
