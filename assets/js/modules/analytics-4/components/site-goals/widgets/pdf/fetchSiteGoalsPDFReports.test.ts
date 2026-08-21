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
import { createTestRegistry } from '@tests/js/utils';
import fetchSiteGoalsPDFReports from './fetchSiteGoalsPDFReports';
import {
	SiteGoalsPDFReportOptions,
	getStoreAggregatedReportOptions,
	getStoreGroupedReportOptions,
} from './reportOptions';
import {
	Registry,
	SITE_GOALS_PDF_TEST_DATES,
	analyticsReportEndpoint,
	buildAggregatedTotalsRows,
	buildBreakdownReportRows,
	provideSiteGoalsPDFReports,
} from './test-utils';

const SITE_GOALS_PDF_REPORT_FIXTURES = {
	groupedEventsReport: {
		rows: buildBreakdownReportRows( 'woocommerce', [ '85' ], [ '76' ] ),
	},
	groupedEngagementReport: {
		rows: buildBreakdownReportRows(
			'woocommerce',
			[ '0.36', '3400' ],
			[ '0.39', '3800' ]
		),
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

/**
 * Returns the report options a builder produced, or throws when it produced
 * none.
 *
 * The builder returns `null` only when no event is detected. Every test here
 * passes an event, so a `null` means the test is wrong.
 *
 * @since n.e.x.t
 *
 * @param {(Object|null)} reportOptions The Site Goals PDF report options, or `null` when no event is detected.
 * @return {Object} The events report options and the engagement report options.
 */
function getRequiredReportOptions(
	reportOptions: SiteGoalsPDFReportOptions | null
): SiteGoalsPDFReportOptions {
	if ( ! reportOptions ) {
		throw new Error( 'Expected Site Goals PDF report options, got null.' );
	}

	return reportOptions;
}

/**
 * Requests the four Online store performance reports.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The WordPress data registry the request runs against.
 * @return {Promise<Object>} The four Online store performance reports.
 */
function fetchOnlineStorePDFReports( registry: Registry ) {
	return fetchSiteGoalsPDFReports( {
		registry,
		signal: new AbortController().signal,
		groupedReportOptions: getRequiredReportOptions(
			getStoreGroupedReportOptions(
				SITE_GOALS_PDF_TEST_DATES,
				'purchase'
			)
		),
		aggregatedReportOptions: getRequiredReportOptions(
			getStoreAggregatedReportOptions(
				SITE_GOALS_PDF_TEST_DATES,
				'purchase'
			)
		),
	} );
}

describe( 'fetchSiteGoalsPDFReports', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'requests four reports, the grouped pair and the aggregated pair', async () => {
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		await fetchOnlineStorePDFReports( registry );

		expect( fetchMock.calls( analyticsReportEndpoint ) ).toHaveLength( 4 );
	} );

	it( 'returns each report under the property name shapeSiteGoalsPDFData reads', async () => {
		provideSiteGoalsPDFReports( SITE_GOALS_PDF_REPORT_FIXTURES );

		const reports = await fetchOnlineStorePDFReports( registry );

		expect( reports ).toEqual( {
			eventsReport: SITE_GOALS_PDF_REPORT_FIXTURES.groupedEventsReport,
			engagementReport:
				SITE_GOALS_PDF_REPORT_FIXTURES.groupedEngagementReport,
			aggregatedEventsReport:
				SITE_GOALS_PDF_REPORT_FIXTURES.aggregatedEventsReport,
			aggregatedEngagementReport:
				SITE_GOALS_PDF_REPORT_FIXTURES.aggregatedEngagementReport,
		} );
	} );

	it( 'throws when one report fails, so the export leaves the Site Goals section out', async () => {
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
			/Site Goals report unavailable/
		);

		expect( console ).toHaveErrored();
	} );
} );
