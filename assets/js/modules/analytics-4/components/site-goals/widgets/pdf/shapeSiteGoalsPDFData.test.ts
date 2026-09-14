/**
 * Site Goals PDF data shaping tests.
 *
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import {
	AGGREGATED_GROUP_ID,
	OTHER_SOURCES_GROUP_ID,
	shapeSiteGoalsPDFData,
} from './shapeSiteGoalsPDFData';

/**
 * Builds a grouped report row.
 *
 * @since 1.187.0
 *
 * @param value     Breakdown dimension value.
 * @param dateRange Date range slug.
 * @param metrics   Metric values, in report order.
 * @return Report row.
 */
function groupedRow( value: string, dateRange: string, metrics: number[] ) {
	return {
		dimensionValues: [ { value }, { value: dateRange } ],
		metricValues: metrics.map( ( metric ) => ( {
			value: String( metric ),
		} ) ),
	};
}

/**
 * Builds a totals row for an aggregated report.
 *
 * @since 1.187.0
 *
 * @param dateRange Date range slug.
 * @param metrics   Metric values, in report order.
 * @return Totals row.
 */
function totalsRow( dateRange: string, metrics: number[] ) {
	return {
		dimensionValues: [ { value: dateRange } ],
		metricValues: metrics.map( ( metric ) => ( {
			value: String( metric ),
		} ) ),
	};
}

describe( 'shapeSiteGoalsPDFData', () => {
	const aggregatedLabel = 'Online store performance';

	// Events report carries `eventCount` only.
	const eventsReport = {
		rows: [
			groupedRow( 'woocommerce', 'date_range_0', [ 50 ] ),
			groupedRow( 'woocommerce', 'date_range_1', [ 40 ] ),
			groupedRow( 'easy-digital-downloads', 'date_range_0', [ 20 ] ),
			groupedRow( 'easy-digital-downloads', 'date_range_1', [ 25 ] ),
		],
	} as Report;

	// Engagement report carries `engagementRate` then `sessions`, and is not
	// scoped to the goal's events.
	const engagementReport = {
		rows: [
			groupedRow( 'woocommerce', 'date_range_0', [ 0.4, 1000 ] ),
			groupedRow( 'woocommerce', 'date_range_1', [ 0.3, 800 ] ),
			groupedRow(
				'easy-digital-downloads',
				'date_range_0',
				[ 0.2, 500 ]
			),
			groupedRow(
				'easy-digital-downloads',
				'date_range_1',
				[ 0.25, 500 ]
			),
		],
	} as Report;

	const labels = {
		woocommerce: 'WooCommerce',
		'easy-digital-downloads': 'Easy Digital Downloads',
	};

	const breakdownValues = [ 'woocommerce', 'easy-digital-downloads' ];

	it( 'shapes each group with its rate, total, engagement rate and trends', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			engagementReport,
			breakdownValues,
			labels,
			aggregatedLabel,
		} );

		expect( groups ).toHaveLength( 2 );

		expect( groups[ 0 ] ).toEqual( {
			id: 'woocommerce',
			label: 'WooCommerce',
			total: { current: 50, previous: 40 },
			sessions: { current: 1000, previous: 800 },
			// 50/1000 and 40/800.
			rate: { current: 0.05, previous: 0.05 },
			engagementRate: { current: 0.4, previous: 0.3 },
		} );

		expect( groups[ 1 ].label ).toBe( 'Easy Digital Downloads' );
		expect( groups[ 1 ].total ).toEqual( { current: 20, previous: 25 } );
		expect( groups[ 1 ].sessions ).toEqual( {
			current: 500,
			previous: 500,
		} );
	} );

	it( 'takes the rate denominator from the engagement report, not the event count', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			engagementReport,
			breakdownValues: [ 'woocommerce' ],
			labels,
			aggregatedLabel,
		} );

		// 50 events over 1000 sessions, not over the events themselves.
		expect( groups[ 0 ].rate?.current ).toBe( 0.05 );
		expect( groups[ 0 ].sessions?.current ).toBe( 1000 );
	} );

	it( 'orders groups by the breakdown values, not by report order', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			engagementReport,
			breakdownValues: [ 'easy-digital-downloads', 'woocommerce' ],
			labels,
			aggregatedLabel,
		} );

		expect( groups.map( ( { id } ) => id ) ).toEqual( [
			'easy-digital-downloads',
			'woocommerce',
		] );
	} );

	it( 'falls back to the dimension value when a group has no label', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			engagementReport,
			breakdownValues: [ 'woocommerce' ],
			aggregatedLabel,
		} );

		expect( groups[ 0 ].label ).toBe( 'woocommerce' );
	} );

	it( 'reports a zero rate rather than dividing by zero sessions', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport: {
				rows: [ groupedRow( 'woocommerce', 'date_range_0', [ 5 ] ) ],
			} as Report,
			engagementReport: {
				rows: [ groupedRow( 'woocommerce', 'date_range_0', [ 0, 0 ] ) ],
			} as Report,
			breakdownValues: [ 'woocommerce' ],
			aggregatedLabel,
		} );

		expect( groups[ 0 ].rate ).toEqual( { current: 0, previous: 0 } );
	} );

	describe( 'Other sources', () => {
		const eventsWithUnattributed = {
			rows: [
				...( eventsReport.rows ?? [] ),
				groupedRow( 'some-other-plugin', 'date_range_0', [ 7 ] ),
				groupedRow( 'some-other-plugin', 'date_range_1', [ 3 ] ),
				groupedRow( '(not set)', 'date_range_0', [ 2 ] ),
			],
		} as Report;

		it( 'folds unattributed rows into a trailing total-only group', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport: eventsWithUnattributed,
				engagementReport,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			const otherSources = groups[ groups.length - 1 ];

			expect( otherSources.id ).toBe( OTHER_SOURCES_GROUP_ID );
			expect( otherSources.label ).toBe( 'Other sources' );
			// 7 + 2 current, 3 + 0 previous.
			expect( otherSources.total ).toEqual( { current: 9, previous: 3 } );
			expect( otherSources.rate ).toBeUndefined();
			expect( otherSources.engagementRate ).toBeUndefined();
			expect( otherSources.sessions ).toBeUndefined();
		} );

		it( 'omits the group when every row is attributed', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport,
				engagementReport,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			expect(
				groups.some( ( { id } ) => id === OTHER_SOURCES_GROUP_ID )
			).toBe( false );
		} );

		it( 'omits the group when unattributed rows carry no events', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport: {
					rows: [
						groupedRow( 'woocommerce', 'date_range_0', [ 5 ] ),
						groupedRow( 'unknown', 'date_range_0', [ 0 ] ),
					],
				} as Report,
				engagementReport,
				breakdownValues: [ 'woocommerce' ],
				aggregatedLabel,
			} );

			expect( groups ).toHaveLength( 1 );
		} );
	} );

	describe( 'aggregated fallback', () => {
		const aggregatedEventsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 85 ] ),
				totalsRow( 'date_range_1', [ 70 ] ),
			],
		} as Report;

		const aggregatedEngagementReport = {
			totals: [
				totalsRow( 'date_range_0', [ 0.36, 3579 ] ),
				totalsRow( 'date_range_1', [ 0.3, 3000 ] ),
			],
		} as Report;

		it( 'shapes a single group when there is no breakdown data', () => {
			const groups = shapeSiteGoalsPDFData( {
				aggregatedEventsReport,
				aggregatedEngagementReport,
				breakdownValues: [],
				aggregatedLabel,
			} );

			expect( groups ).toHaveLength( 1 );
			expect( groups[ 0 ] ).toEqual( {
				id: AGGREGATED_GROUP_ID,
				label: aggregatedLabel,
				total: { current: 85, previous: 70 },
				// Site-wide sessions, so the rate stays a small percentage.
				sessions: { current: 3579, previous: 3000 },
				rate: { current: 85 / 3579, previous: 70 / 3000 },
				engagementRate: { current: 0.36, previous: 0.3 },
			} );
		} );

		it( 'falls back when the grouped report has no supported values', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport: {
					rows: [ groupedRow( 'unknown', 'date_range_0', [ 5 ] ) ],
				} as Report,
				engagementReport,
				aggregatedEventsReport,
				aggregatedEngagementReport,
				breakdownValues: [ 'woocommerce' ],
				aggregatedLabel,
			} );

			expect( groups ).toHaveLength( 1 );
			expect( groups[ 0 ].id ).toBe( AGGREGATED_GROUP_ID );
		} );

		it( 'returns no groups when the reports have no data', () => {
			expect(
				shapeSiteGoalsPDFData( {
					breakdownValues: [],
					aggregatedLabel,
				} )
			).toEqual( [] );
		} );
	} );
} );
