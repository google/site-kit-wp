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

	// Key action sessions report carries `sessions` only. A session counts
	// once, however many Key action events it holds.
	const keyActionSessionsReport = {
		rows: [
			groupedRow( 'woocommerce', 'date_range_0', [ 30 ] ),
			groupedRow( 'woocommerce', 'date_range_1', [ 24 ] ),
			groupedRow( 'easy-digital-downloads', 'date_range_0', [ 10 ] ),
			groupedRow( 'easy-digital-downloads', 'date_range_1', [ 15 ] ),
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

	// The site's sessions, not scoped to a group or to the goal's events.
	const aggregatedEngagementReport = {
		totals: [
			totalsRow( 'date_range_0', [ 0.5, 2000 ] ),
			totalsRow( 'date_range_1', [ 0.45, 1600 ] ),
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
			keyActionSessionsReport,
			engagementReport,
			aggregatedEngagementReport,
			breakdownValues,
			labels,
			aggregatedLabel,
		} );

		expect( groups ).toHaveLength( 2 );

		expect( groups[ 0 ] ).toEqual( {
			id: 'woocommerce',
			label: 'WooCommerce',
			total: { current: 50, previous: 40 },
			// Every group shows the site's sessions.
			sessions: { current: 2000, previous: 1600 },
			// 30/2000 and 24/1600.
			rate: { current: 0.015, previous: 0.015 },
			engagementRate: { current: 0.4, previous: 0.3 },
			// The engagement rate is a share of the group's own sessions.
			engagementSessions: { current: 1000, previous: 800 },
		} );

		expect( groups[ 1 ].label ).toBe( 'Easy Digital Downloads' );
		expect( groups[ 1 ].total ).toEqual( { current: 20, previous: 25 } );
		expect( groups[ 1 ].sessions ).toEqual( {
			current: 2000,
			previous: 1600,
		} );
		expect( groups[ 1 ].rate ).toEqual( {
			current: 10 / 2000,
			previous: 15 / 1600,
		} );
		expect( groups[ 1 ].engagementSessions ).toEqual( {
			current: 500,
			previous: 500,
		} );
	} );

	it( 'computes the rate from the sessions with a Key action over the site sessions, not the event count or the group sessions', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			keyActionSessionsReport,
			engagementReport,
			aggregatedEngagementReport,
			breakdownValues: [ 'woocommerce' ],
			labels,
			aggregatedLabel,
		} );

		// 30 sessions with a sale over the site's 2000 sessions, not the 50
		// events or the group's 1000 sessions.
		expect( groups[ 0 ].rate?.current ).toBe( 0.015 );
		expect( groups[ 0 ].sessions?.current ).toBe( 2000 );
	} );

	it( 'orders groups by the breakdown values, not by report order', () => {
		const groups = shapeSiteGoalsPDFData( {
			eventsReport,
			keyActionSessionsReport,
			engagementReport,
			aggregatedEngagementReport,
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
			keyActionSessionsReport,
			engagementReport,
			aggregatedEngagementReport,
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
			keyActionSessionsReport: {
				rows: [ groupedRow( 'woocommerce', 'date_range_0', [ 5 ] ) ],
			} as Report,
			engagementReport: {
				rows: [ groupedRow( 'woocommerce', 'date_range_0', [ 0, 0 ] ) ],
			} as Report,
			aggregatedEngagementReport: {
				totals: [ totalsRow( 'date_range_0', [ 0, 0 ] ) ],
			} as Report,
			breakdownValues: [ 'woocommerce' ],
			aggregatedLabel,
		} );

		expect( groups[ 0 ].rate ).toEqual( { current: 0, previous: 0 } );
	} );

	describe( 'Other sources', () => {
		it( 'puts the events no group covers into a trailing total-only group', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport,
				keyActionSessionsReport,
				engagementReport,
				aggregatedEngagementReport,
				aggregatedEventsReport: {
					totals: [
						totalsRow( 'date_range_0', [ 79 ] ),
						totalsRow( 'date_range_1', [ 68 ] ),
					],
				} as Report,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			const otherSources = groups[ groups.length - 1 ];

			expect( otherSources.id ).toBe( OTHER_SOURCES_GROUP_ID );
			expect( otherSources.label ).toBe( 'Other sources' );
			expect( otherSources.total ).toEqual( { current: 9, previous: 3 } );
			expect( otherSources.rate ).toBeUndefined();
			expect( otherSources.engagementRate ).toBeUndefined();
			expect( otherSources.sessions ).toBeUndefined();
		} );

		it( 'counts the sales Analytics leaves out of the grouped report', () => {
			// The `(not set)` row reports 4 sales, and the site-wide total is 9
			// more than the two plugin groups. Analytics left the other 5 out.
			const groups = shapeSiteGoalsPDFData( {
				eventsReport: {
					rows: [
						...( eventsReport.rows ?? [] ),
						groupedRow( '(not set)', 'date_range_0', [ 4 ] ),
					],
				} as Report,
				engagementReport,
				aggregatedEventsReport: {
					totals: [
						totalsRow( 'date_range_0', [ 79 ] ),
						totalsRow( 'date_range_1', [ 68 ] ),
					],
				} as Report,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			expect( groups[ groups.length - 1 ].total ).toEqual( {
				current: 9,
				previous: 3,
			} );
		} );

		it( 'omits the group when the plugin groups add up to the site-wide total', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport,
				keyActionSessionsReport,
				engagementReport,
				aggregatedEngagementReport,
				aggregatedEventsReport: {
					totals: [
						totalsRow( 'date_range_0', [ 70 ] ),
						totalsRow( 'date_range_1', [ 65 ] ),
					],
				} as Report,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			expect(
				groups.some( ( { id } ) => id === OTHER_SOURCES_GROUP_ID )
			).toBe( false );
		} );

		it( 'shows zero rather than a negative count when the site-wide total is lower than the plugin groups', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport,
				keyActionSessionsReport,
				engagementReport,
				aggregatedEngagementReport,
				aggregatedEventsReport: {
					totals: [
						totalsRow( 'date_range_0', [ 60 ] ),
						totalsRow( 'date_range_1', [ 68 ] ),
					],
				} as Report,
				breakdownValues,
				labels,
				aggregatedLabel,
			} );

			expect( groups[ groups.length - 1 ] ).toEqual( {
				id: 'other-sources',
				label: 'Other sources',
				total: { current: 0, previous: 3 },
			} );
		} );
	} );

	describe( 'aggregated fallback', () => {
		const aggregatedEventsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 85 ] ),
				totalsRow( 'date_range_1', [ 70 ] ),
			],
		} as Report;

		const aggregatedKeyActionSessionsReport = {
			totals: [
				totalsRow( 'date_range_0', [ 70 ] ),
				totalsRow( 'date_range_1', [ 60 ] ),
			],
		} as Report;

		const siteEngagementReport = {
			totals: [
				totalsRow( 'date_range_0', [ 0.36, 3579 ] ),
				totalsRow( 'date_range_1', [ 0.3, 3000 ] ),
			],
		} as Report;

		it( 'shapes a single group when there is no breakdown data', () => {
			const groups = shapeSiteGoalsPDFData( {
				aggregatedEventsReport,
				aggregatedKeyActionSessionsReport,
				aggregatedEngagementReport: siteEngagementReport,
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
				// 70 sessions with a sale, not the 85 events.
				rate: { current: 70 / 3579, previous: 60 / 3000 },
				engagementRate: { current: 0.36, previous: 0.3 },
				engagementSessions: { current: 3579, previous: 3000 },
			} );
		} );

		it( 'falls back when the grouped report has no supported values', () => {
			const groups = shapeSiteGoalsPDFData( {
				eventsReport: {
					rows: [ groupedRow( 'unknown', 'date_range_0', [ 5 ] ) ],
				} as Report,
				engagementReport,
				aggregatedEventsReport,
				aggregatedKeyActionSessionsReport,
				aggregatedEngagementReport: siteEngagementReport,
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
