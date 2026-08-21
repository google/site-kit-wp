/**
 * PDF data loader tests for the Lead generation performance widget.
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
import { createTestRegistry } from '@tests/js/utils';
import getLeadGenerationPerformancePDFData from './getLeadGenerationPerformancePDFData';
import {
	Registry,
	analyticsReportEndpoint,
	buildAggregatedTotalsRows,
	buildBreakdownReportRows,
	provideDetectedEvents,
	provideSiteGoalsPDFReports,
	runSiteGoalsPDFLoader,
} from './pdf/test-utils';

/** Matches the form metadata endpoint the form titles come from. */
const formMetadataEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/form-metadata'
);

const SITE_GOALS_PDF_REPORT_FIXTURES = {
	discoveryReport: {
		rows: [ '12', '34' ].map( ( value ) => ( {
			dimensionValues: [ { value } ],
			metricValues: [ { value: '52' } ],
		} ) ),
	},
	groupedEventsReport: {
		rows: [
			...buildBreakdownReportRows( '12', [ '40' ], [ '30' ] ),
			...buildBreakdownReportRows( '34', [ '12' ], [ '9' ] ),
			...buildBreakdownReportRows( '(not set)', [ '5' ], [ '2' ] ),
		],
	},
	groupedEngagementReport: {
		rows: [
			...buildBreakdownReportRows(
				'12',
				[ '0.4', '200' ],
				[ '0.3', '150' ]
			),
			...buildBreakdownReportRows(
				'34',
				[ '0.6', '100' ],
				[ '0.5', '90' ]
			),
		],
	},
	aggregatedEventsReport: {
		totals: buildAggregatedTotalsRows( [ '57' ], [ '41' ] ),
	},
	aggregatedEngagementReport: {
		totals: buildAggregatedTotalsRows(
			[ '0.45', '900' ],
			[ '0.42', '850' ]
		),
	},
};

describe( 'getLeadGenerationPerformancePDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		fetchMock.get( formMetadataEndpoint, {
			body: { 12: { title: 'Contact' }, 34: { title: null } },
			status: 200,
		} );
	} );

	it( 'builds one group per form, named by the form title', async () => {
		provideDetectedEvents( registry, [ 'contact' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		const { data } = await runSiteGoalsPDFLoader(
			getLeadGenerationPerformancePDFData,
			registry
		);

		expect( data?.leadEvents ).toEqual( [ 'contact' ] );
		expect( data?.dateRangeLength ).toBe( 28 );
		expect( data?.groups.slice( 0, 2 ) ).toEqual( [
			{
				id: '12',
				label: '“Contact” form',
				total: { current: 40, previous: 30 },
				sessions: { current: 200, previous: 150 },
				rate: { current: 0.2, previous: 0.2 },
				engagementRate: { current: 0.4, previous: 0.3 },
			},
			{
				// A form with no title on the site falls back to its ID.
				id: '34',
				label: 'Form #34',
				total: { current: 12, previous: 9 },
				sessions: { current: 100, previous: 90 },
				rate: { current: 0.12, previous: 0.1 },
				engagementRate: { current: 0.6, previous: 0.5 },
			},
		] );
	} );

	it( 'counts a completion with no form ID under "Other sources"', async () => {
		provideDetectedEvents( registry, [ 'contact' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		const { data } = await runSiteGoalsPDFLoader(
			getLeadGenerationPerformancePDFData,
			registry
		);

		expect( data?.groups[ data.groups.length - 1 ] ).toEqual( {
			id: 'other-sources',
			label: 'Other sources',
			total: { current: 5, previous: 2 },
		} );
	} );

	it( 'falls back to a single group for the whole site when no form is found', async () => {
		provideDetectedEvents( registry, [ 'contact', 'generate_lead' ] );
		provideSiteGoalsPDFReports( {
			...SITE_GOALS_PDF_REPORT_FIXTURES,
			discoveryReport: { rows: [] },
		} );

		const { data } = await runSiteGoalsPDFLoader(
			getLeadGenerationPerformancePDFData,
			registry
		);

		expect( data?.groups ).toEqual( [
			{
				id: 'aggregated',
				label: 'Lead generation performance',
				total: { current: 57, previous: 41 },
				sessions: { current: 900, previous: 850 },
				rate: {
					current: 57 / 900,
					previous: 41 / 850,
				},
				engagementRate: { current: 0.45, previous: 0.42 },
			},
		] );
	} );

	it( 'returns no data when every Analytics report is empty', async () => {
		provideDetectedEvents( registry, [ 'contact' ] );
		provideSiteGoalsPDFReports( {
			...SITE_GOALS_PDF_REPORT_FIXTURES,
			discoveryReport: { rows: [] },
			aggregatedEventsReport: {},
			aggregatedEngagementReport: {},
		} );

		expect(
			await runSiteGoalsPDFLoader(
				getLeadGenerationPerformancePDFData,
				registry
			)
		).toEqual( {
			data: null,
		} );
	} );

	it( 'returns no data when no lead event is detected', async () => {
		provideDetectedEvents( registry, [ 'purchase' ] );

		expect(
			await runSiteGoalsPDFLoader(
				getLeadGenerationPerformancePDFData,
				registry
			)
		).toEqual( {
			data: null,
		} );
		expect( fetchMock ).not.toHaveFetched( analyticsReportEndpoint );
	} );

	it( 'returns no data and requests no report when the signal is already aborted', async () => {
		provideDetectedEvents( registry, [ 'contact' ] );
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		expect(
			await runSiteGoalsPDFLoader(
				getLeadGenerationPerformancePDFData,
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
