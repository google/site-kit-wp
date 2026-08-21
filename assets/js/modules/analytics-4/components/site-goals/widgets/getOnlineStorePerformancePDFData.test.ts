/**
 * PDF data loader tests for the Online store performance widget.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { createTestRegistry } from '@tests/js/utils';
import getOnlineStorePerformancePDFData from './getOnlineStorePerformancePDFData';
import {
	Registry,
	analyticsReportEndpoint,
	buildAggregatedTotalsRows,
	buildBreakdownReportRows,
	provideDetectedEvents,
	provideSiteGoalsPDFReports,
	runSiteGoalsPDFLoader,
} from './pdf/test-utils';

/**
 * The ecommerce providers found over the 90-day discovery window, including one
 * the Online store performance widget does not support.
 */
const DISCOVERY_REPORT: Report = {
	rows: [ 'woocommerce', 'easy-digital-downloads', 'shopify' ].map(
		( value ) => ( {
			dimensionValues: [ { value } ],
			metricValues: [ { value: '45' } ],
		} )
	),
};

const SITE_GOALS_PDF_REPORT_FIXTURES = {
	discoveryReport: DISCOVERY_REPORT,
	groupedEventsReport: {
		rows: [
			...buildBreakdownReportRows( 'woocommerce', [ '85' ], [ '76' ] ),
			...buildBreakdownReportRows(
				'easy-digital-downloads',
				[ '20' ],
				[ '25' ]
			),
			...buildBreakdownReportRows( 'shopify', [ '9' ], [ '6' ] ),
			...buildBreakdownReportRows( '(not set)', [ '7' ], [ '4' ] ),
		],
	},
	groupedEngagementReport: {
		rows: [
			...buildBreakdownReportRows(
				'woocommerce',
				[ '0.36', '3400' ],
				[ '0.39', '3800' ]
			),
			...buildBreakdownReportRows(
				'easy-digital-downloads',
				[ '0.5', '500' ],
				[ '0.25', '500' ]
			),
		],
	},
	aggregatedEventsReport: {
		totals: buildAggregatedTotalsRows( [ '112' ], [ '105' ] ),
	},
	aggregatedEngagementReport: {
		totals: buildAggregatedTotalsRows(
			[ '0.42', '5600' ],
			[ '0.4', '5250' ]
		),
	},
};

describe( 'getOnlineStorePerformancePDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	} );

	it( 'builds one group per supported ecommerce plugin, named after the plugin', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		const { data } = await runSiteGoalsPDFLoader(
			getOnlineStorePerformancePDFData,
			registry
		);

		expect( data?.primaryEvent ).toBe( 'purchase' );
		expect( data?.dateRangeLength ).toBe( 28 );
		expect( data?.groups.slice( 0, 2 ) ).toEqual( [
			{
				id: 'woocommerce',
				label: 'WooCommerce',
				total: { current: 85, previous: 76 },
				sessions: { current: 3400, previous: 3800 },
				rate: { current: 0.025, previous: 0.02 },
				engagementRate: { current: 0.36, previous: 0.39 },
			},
			{
				id: 'easy-digital-downloads',
				label: 'Easy Digital Downloads',
				total: { current: 20, previous: 25 },
				sessions: { current: 500, previous: 500 },
				rate: { current: 0.04, previous: 0.05 },
				engagementRate: { current: 0.5, previous: 0.25 },
			},
		] );
	} );

	it( 'counts a sale from an unsupported plugin under "Other sources"', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		const { data } = await runSiteGoalsPDFLoader(
			getOnlineStorePerformancePDFData,
			registry
		);

		// The 9 sales from `shopify` and the 7 with no provider both go into
		// the "Other sources" group.
		expect( data?.groups[ data.groups.length - 1 ] ).toEqual( {
			id: 'other-sources',
			label: 'Other sources',
			total: { current: 16, previous: 10 },
		} );
	} );

	it( 'falls back to a single group for the whole site when no plugin is found', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );
		provideSiteGoalsPDFReports( {
			...SITE_GOALS_PDF_REPORT_FIXTURES,
			discoveryReport: { rows: [] },
		} );

		const { data } = await runSiteGoalsPDFLoader(
			getOnlineStorePerformancePDFData,
			registry
		);

		expect( data?.groups ).toEqual( [
			{
				id: 'aggregated',
				label: 'Online store performance',
				total: { current: 112, previous: 105 },
				sessions: { current: 5600, previous: 5250 },
				rate: { current: 0.02, previous: 0.02 },
				engagementRate: { current: 0.42, previous: 0.4 },
			},
		] );
	} );

	it( 'returns no data when every Analytics report is empty', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );
		provideSiteGoalsPDFReports( {
			...SITE_GOALS_PDF_REPORT_FIXTURES,
			discoveryReport: { rows: [] },
			aggregatedEventsReport: {},
			aggregatedEngagementReport: {},
		} );

		expect(
			await runSiteGoalsPDFLoader(
				getOnlineStorePerformancePDFData,
				registry
			)
		).toEqual( {
			data: null,
		} );
	} );

	it( 'returns no data when no ecommerce event is detected', async () => {
		provideDetectedEvents( registry, [ 'contact' ] );

		expect(
			await runSiteGoalsPDFLoader(
				getOnlineStorePerformancePDFData,
				registry
			)
		).toEqual( {
			data: null,
		} );
		expect( fetchMock ).not.toHaveFetched( analyticsReportEndpoint );
	} );

	it( 'returns no data and requests no report when the signal is already aborted', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		expect(
			await runSiteGoalsPDFLoader(
				getOnlineStorePerformancePDFData,
				registry,
				{
					isAborted: true,
				}
			)
		).toEqual( {
			data: null,
		} );
		expect( fetchMock ).not.toHaveFetched( analyticsReportEndpoint );
	} );
} );
