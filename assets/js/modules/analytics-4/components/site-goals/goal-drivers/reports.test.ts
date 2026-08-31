/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { GOAL_DRIVER_IDS } from './constants';
import {
	GOAL_DRIVER_REPORT_OPTIONS_BUILDERS,
	GOAL_DRIVER_ROW_MAPPERS,
	buildEngagementReportOptions,
	buildGoalDriverTotalReportOptions,
	buildPrimaryEventReportOptions,
	getGoalDriverTotalCount,
	makeShareOfExplicitTotalMapper,
} from './reports';

function makeRow( dimensionValue: string, ...metricValues: string[] ) {
	return {
		dimensionValues: [ { value: dimensionValue } ],
		metricValues: metricValues.map( ( value ) => ( { value } ) ),
	};
}

describe( 'Site Goals Goal Drivers reports', () => {
	const dates = { startDate: '2025-08-01', endDate: '2025-08-28' };

	describe( 'GOAL_DRIVER_REPORT_OPTIONS_BUILDERS', () => {
		it.each( Object.values( GOAL_DRIVER_IDS ) )(
			'should return undefined for %s without a primary event',
			( driverID ) => {
				expect(
					GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[ driverID ]( {
						dates,
						primaryEvent: undefined,
						limit: 6,
					} )
				).toBeUndefined();
			}
		);

		it.each( Object.values( GOAL_DRIVER_IDS ) )(
			'should return undefined for %s without dates',
			( driverID ) => {
				expect(
					GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[ driverID ]( {
						dates: undefined,
						primaryEvent: 'purchase',
						limit: 6,
					} )
				).toBeUndefined();
			}
		);

		it( 'should request the given row limit for every driver', () => {
			Object.values( GOAL_DRIVER_IDS ).forEach( ( driverID ) => {
				const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[ driverID ](
					{
						dates,
						primaryEvent: 'purchase',
						limit: 6,
					}
				);

				expect( options?.limit ).toBe( 6 );
			} );
		} );

		it( 'should exclude "(not set)" rows for cities and countries only', () => {
			const cities = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.CITIES
			]( { dates, primaryEvent: 'purchase', limit: 6 } );
			const countries = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.COUNTRIES
			]( { dates, primaryEvent: 'purchase', limit: 6 } );
			const deviceType = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.DEVICE_TYPE
			]( { dates, primaryEvent: 'purchase', limit: 6 } );

			expect( cities?.dimensionFilters?.city ).toMatchObject( {
				filterType: 'emptyFilter',
				notExpression: true,
			} );
			expect( countries?.dimensionFilters?.country ).toMatchObject( {
				filterType: 'emptyFilter',
				notExpression: true,
			} );
			expect( deviceType?.dimensionFilters ).not.toHaveProperty(
				'deviceCategory'
			);
		} );

		it( 'should scope the report to a breakdown filter when provided', () => {
			const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.VISITOR_TYPE
			]( {
				dates,
				primaryEvent: 'purchase',
				breakdownFilter: { someDimension: 'someValue' },
				limit: 6,
			} );

			expect( options?.dimensionFilters ).toMatchObject( {
				someDimension: 'someValue',
			} );
		} );

		it.each( [
			[ GOAL_DRIVER_IDS.CITIES, 6 ],
			[ GOAL_DRIVER_IDS.TOP_AUTHORS, 6 ],
			[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE, 6 ],
			[ GOAL_DRIVER_IDS.TOP_PAGES, 6 ],
		] )(
			'should append the given context to the %s reportID, and omit it otherwise',
			( driverID, limit ) => {
				const withoutContext = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					driverID
				]( { dates, primaryEvent: 'purchase', limit } );
				const withContext = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
					driverID
				]( {
					dates,
					primaryEvent: 'purchase',
					limit,
					context: 'ecommerce',
				} );

				expect( withContext?.reportID ).toBe(
					`${ withoutContext?.reportID }_ecommerce`
				);
			}
		);

		it( 'should filter the top authors report to rows with the author dimension set', () => {
			const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.TOP_AUTHORS
			]( { dates, primaryEvent: 'purchase', limit: 6 } );

			expect(
				options?.dimensionFilters?.[
					'customEvent:googlesitekit_post_author'
				]
			).toMatchObject( {
				filterType: 'emptyFilter',
				notExpression: true,
			} );
		} );

		it( 'should request both eventCount and sessions for the traffic channels rate', () => {
			const options = GOAL_DRIVER_REPORT_OPTIONS_BUILDERS[
				GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
			]( { dates, primaryEvent: 'purchase', limit: 6 } );

			expect( options?.metrics ).toEqual( [
				{ name: 'eventCount' },
				{ name: 'sessions' },
			] );
		} );
	} );

	describe( 'GOAL_DRIVER_ROW_MAPPERS', () => {
		it( 'should map each row to its share of the total as a percentage', () => {
			const rows = [ makeRow( 'Paris', '3' ), makeRow( 'Berlin', '1' ) ];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.CITIES ]( rows )
			).toEqual( [
				{ label: 'Paris', value: '75%' },
				{ label: 'Berlin', value: '25%' },
			] );
		} );

		it( 'should sum the total from only the rows it is given', () => {
			// The percentage denominator is the sum of the rows passed in, not
			// an independently fetched total, so a smaller row set changes it.
			const allRows = [
				makeRow( 'Paris', '3' ),
				makeRow( 'Berlin', '1' ),
				makeRow( 'Rome', '1' ),
			];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.CITIES ](
					allRows.slice( 0, 2 )
				)
			).toEqual( [
				{ label: 'Paris', value: '75%' },
				{ label: 'Berlin', value: '25%' },
			] );
		} );

		it( 'should label empty dimension values as "(not set)" for cities, countries, authors and device type', () => {
			const rows = [ makeRow( '', '1' ) ];

			[
				GOAL_DRIVER_IDS.CITIES,
				GOAL_DRIVER_IDS.COUNTRIES,
				GOAL_DRIVER_IDS.DEVICE_TYPE,
				GOAL_DRIVER_IDS.TOP_AUTHORS,
			].forEach( ( driverID ) => {
				expect( GOAL_DRIVER_ROW_MAPPERS[ driverID ]( rows ) ).toEqual( [
					{ label: '(not set)', value: '100%' },
				] );
			} );
		} );

		it( 'should label empty dimension values as "-" for traffic channels and visitor type', () => {
			const rows = [ makeRow( '', '1' ) ];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS ](
					rows
				)
			).toEqual( [ { label: '-', value: '100%' } ] );
			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.VISITOR_TYPE ]( rows )
			).toEqual( [ { label: '-', value: '100%' } ] );
		} );

		it( 'should translate known visitor type values to their labels', () => {
			const rows = [ makeRow( 'new', '1' ), makeRow( 'returning', '1' ) ];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.VISITOR_TYPE ]( rows )
			).toEqual( [
				{ label: 'New visitors', value: '50%' },
				{ label: 'Returning visitors', value: '50%' },
			] );
		} );

		it( 'should map top pages rows to a raw event count rather than a share', () => {
			const rows = [ makeRow( '/blog/post', '42' ) ];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.TOP_PAGES ]( rows )
			).toEqual( [
				{ label: '/blog/post', value: '42', pagePath: '/blog/post' },
			] );
		} );

		it( "should map top traffic channels rate rows to that channel's own rate, not a share of the total", () => {
			const rows = [
				makeRow( 'Organic Search', '3', '10' ),
				makeRow( 'Direct', '1', '20' ),
			];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[
					GOAL_DRIVER_IDS.TOP_TRAFFIC_CHANNELS_RATE
				]( rows )
			).toEqual( [
				{ label: 'Organic Search', value: '30%' },
				{ label: 'Direct', value: '5%' },
			] );
		} );

		it( 'should return a 0% value rather than dividing by zero when the total is zero', () => {
			const rows = [ makeRow( 'Paris', '0' ) ];

			expect(
				GOAL_DRIVER_ROW_MAPPERS[ GOAL_DRIVER_IDS.CITIES ]( rows )
			).toEqual( [ { label: 'Paris', value: '0%' } ] );
		} );
	} );

	describe( 'buildPrimaryEventReportOptions', () => {
		it( 'should return undefined without a primary event', () => {
			expect(
				buildPrimaryEventReportOptions( dates, undefined )
			).toBeUndefined();
		} );

		it( 'should filter the report to the primary event', () => {
			const options = buildPrimaryEventReportOptions( dates, 'purchase' );

			expect( options?.dimensionFilters ).toMatchObject( {
				eventName: 'purchase',
			} );
		} );

		it( 'should scope the report to a breakdown filter when provided', () => {
			const options = buildPrimaryEventReportOptions( dates, 'purchase', {
				someDimension: 'someValue',
			} );

			expect( options?.dimensionFilters ).toMatchObject( {
				someDimension: 'someValue',
			} );
		} );
	} );

	describe( 'buildEngagementReportOptions', () => {
		it( 'should request engagement rate and sessions', () => {
			const options = buildEngagementReportOptions( dates );

			expect( options.metrics ).toEqual( [
				{ name: 'engagementRate' },
				{ name: 'sessions' },
			] );
		} );

		it( 'should never scope the engagement report to the goal events', () => {
			// Filtering engagement by `eventName` would count only the
			// sessions that already converted, pushing the rate to ~100%.
			expect( buildEngagementReportOptions( dates ) ).not.toHaveProperty(
				'dimensionFilters'
			);
		} );

		it( 'should scope the report to a breakdown filter when provided', () => {
			const options = buildEngagementReportOptions( dates, {
				someDimension: 'someValue',
			} );

			expect( options.dimensionFilters ).toEqual( {
				someDimension: 'someValue',
			} );
		} );
	} );

	describe( 'buildGoalDriverTotalReportOptions', () => {
		it( 'should return undefined without a primary event', () => {
			expect(
				buildGoalDriverTotalReportOptions( {
					dates,
					reportIDSuffix: 'top-authors',
				} )
			).toBeUndefined();
		} );

		it( 'should request eventCount with no dimension breakdown or row limit', () => {
			const options = buildGoalDriverTotalReportOptions( {
				dates,
				primaryEvent: 'purchase',
				reportIDSuffix: 'top-authors',
			} );

			expect( options?.metrics ).toEqual( [ { name: 'eventCount' } ] );
			expect( options ).not.toHaveProperty( 'dimensions' );
			expect( options ).not.toHaveProperty( 'limit' );
		} );

		it( 'should filter to the primary event, matching the ranked report', () => {
			const options = buildGoalDriverTotalReportOptions( {
				dates,
				primaryEvent: 'purchase',
				reportIDSuffix: 'top-authors',
			} );

			expect( options?.dimensionFilters ).toMatchObject( {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'purchase' ],
				},
			} );
		} );

		it( 'should append the given context to the reportID, and omit it otherwise', () => {
			const withoutContext = buildGoalDriverTotalReportOptions( {
				dates,
				primaryEvent: 'purchase',
				reportIDSuffix: 'top-authors',
			} );
			const withContext = buildGoalDriverTotalReportOptions( {
				dates,
				primaryEvent: 'purchase',
				reportIDSuffix: 'top-authors',
				context: 'ecommerce',
			} );

			expect( withContext?.reportID ).toBe(
				`${ withoutContext?.reportID }_ecommerce`
			);
		} );
	} );

	describe( 'getGoalDriverTotalCount', () => {
		it( 'should read the total report row into a plain count', () => {
			expect(
				getGoalDriverTotalCount( {
					rows: [ { metricValues: [ { value: '1000' } ] } ],
				} )
			).toBe( 1000 );
		} );

		it( 'should return 0 when the report has no rows yet', () => {
			expect( getGoalDriverTotalCount( { rows: [] } ) ).toBe( 0 );
			expect( getGoalDriverTotalCount( undefined ) ).toBe( 0 );
		} );
	} );

	describe( 'makeShareOfExplicitTotalMapper', () => {
		it( "should divide each row by the given total, not the rows' own sum", () => {
			// The rows shown (top 3) sum to less than the true site-wide
			// total passed in, exactly the "top authors" / "top traffic
			// channels" case this mapper exists for.
			const rows = [
				makeRow( 'AuthorName1', '305' ),
				makeRow( 'AuthorName2', '247' ),
				makeRow( 'AuthorName3', '162' ),
			];

			expect( makeShareOfExplicitTotalMapper( 1000 )( rows ) ).toEqual( [
				{ label: 'AuthorName1', value: '30.5%' },
				{ label: 'AuthorName2', value: '24.7%' },
				{ label: 'AuthorName3', value: '16.2%' },
			] );
		} );

		it( 'should return a 0% value rather than dividing by zero when the total is zero', () => {
			expect(
				makeShareOfExplicitTotalMapper( 0 )( [
					makeRow( 'Paris', '0' ),
				] )
			).toEqual( [ { label: 'Paris', value: '0%' } ] );
		} );

		it( 'should label empty dimension values as "(not set)" by default', () => {
			expect(
				makeShareOfExplicitTotalMapper( 100 )( [ makeRow( '', '50' ) ] )
			).toEqual( [ { label: '(not set)', value: '50%' } ] );
		} );
	} );
} );
