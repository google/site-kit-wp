/**
 * Site Goals PDF report request tests.
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
import { Registry } from '@/js/googlesitekit/data/types';
import { createTestRegistry } from '@tests/js/utils';
import { ONLINE_STORE_PDF_REPORT_FIXTURES } from './__fixtures__';
import fetchSiteGoalsPDFReports from './fetchSiteGoalsPDFReports';
import {
	SiteGoalsPDFReportOptions,
	getStoreAggregatedReportOptions,
	getStoreGroupedReportOptions,
} from './reportOptions';
import {
	SITE_GOALS_PDF_TEST_DATES,
	analyticsReportEndpoint,
	provideSiteGoalsPDFReports,
} from './test-utils';

// The builders return `null` only when no event is detected, and these always
// pass one, so the cast holds for every test here.
const GROUPED_REPORT_OPTIONS = getStoreGroupedReportOptions(
	SITE_GOALS_PDF_TEST_DATES,
	'purchase'
) as SiteGoalsPDFReportOptions;

const AGGREGATED_REPORT_OPTIONS = getStoreAggregatedReportOptions(
	SITE_GOALS_PDF_TEST_DATES,
	'purchase'
) as SiteGoalsPDFReportOptions;

/**
 * Requests the four Online store performance reports.
 *
 * @since n.e.x.t
 *
 * @param {Object}      registry The WordPress data registry the request runs against.
 * @param {AbortSignal} signal   Signal that cancels the PDF export. Defaults to a signal that never aborts.
 * @return {Promise<Object>} The four Online store performance reports.
 */
function fetchOnlineStorePDFReports(
	registry: Registry,
	signal: AbortSignal = new AbortController().signal
) {
	return fetchSiteGoalsPDFReports( {
		registry,
		signal,
		groupedReportOptions: GROUPED_REPORT_OPTIONS,
		aggregatedReportOptions: AGGREGATED_REPORT_OPTIONS,
	} );
}

describe( 'fetchSiteGoalsPDFReports', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'requests four reports, the grouped pair and the aggregated pair', async () => {
		provideSiteGoalsPDFReports( ONLINE_STORE_PDF_REPORT_FIXTURES );

		await fetchOnlineStorePDFReports( registry );

		expect( fetchMock.calls( analyticsReportEndpoint ) ).toHaveLength( 4 );
	} );

	it( 'returns each report under the property name shapeSiteGoalsPDFData reads', async () => {
		provideSiteGoalsPDFReports( ONLINE_STORE_PDF_REPORT_FIXTURES );

		const reports = await fetchOnlineStorePDFReports( registry );

		expect( reports ).toEqual( {
			eventsReport: ONLINE_STORE_PDF_REPORT_FIXTURES.groupedEventsReport,
			engagementReport:
				ONLINE_STORE_PDF_REPORT_FIXTURES.groupedEngagementReport,
			aggregatedEventsReport:
				ONLINE_STORE_PDF_REPORT_FIXTURES.aggregatedEventsReport,
			aggregatedEngagementReport:
				ONLINE_STORE_PDF_REPORT_FIXTURES.aggregatedEngagementReport,
		} );
	} );

	it( 'throws when one report fails, so the export omits the Site Goals section', async () => {
		fetchMock.get(
			analyticsReportEndpoint,
			{
				body: {
					code: 'test_error',
					message: 'Report request failed.',
					data: { status: 500 },
				},
				status: 500,
			},
			{ overwriteRoutes: true }
		);

		await expect( fetchOnlineStorePDFReports( registry ) ).rejects.toThrow(
			'Site Kit: Site Goals report unavailable. Report request failed.'
		);

		expect( console ).toHaveErrored();
	} );

	it( 'returns no report when the user cancels the export', async () => {
		const controller = new AbortController();
		const deferredResolvers: Array< () => void > = [];

		fetchMock.get(
			analyticsReportEndpoint,
			() =>
				new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( {
								body: {
									code: 'test_error',
									message: 'Report request failed.',
									data: { status: 500 },
								},
								status: 500,
							} )
						);
					}
				),
			{ overwriteRoutes: true }
		);

		const pdfReportsRun = fetchOnlineStorePDFReports(
			registry,
			controller.signal
		);

		// Wait for all four report requests to dispatch before canceling.
		while ( deferredResolvers.length < 4 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		await expect( pdfReportsRun ).resolves.toEqual( {} );
	} );
} );
