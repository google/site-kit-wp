/**
 * Site Goals PDF loader test fixtures and helpers.
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
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';

/** The WordPress data registry a Site Goals PDF loader test runs against. */
export type Registry = GetPDFDataParams[ 'registry' ];

/** Matches the Analytics report endpoint. */
export const analyticsReportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

/** The date range a Site Goals PDF loader test reports on, with the current day excluded. */
export const SITE_GOALS_PDF_TEST_DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/** The Analytics report bodies the mock answers a Site Goals PDF loader with. */
export interface SiteGoalsPDFReportFixtures {
	/** The 90-day Analytics report the breakdown values come from. */
	discoveryReport?: Report;
	/** The Key action events, grouped by the breakdown dimension. */
	groupedEventsReport?: Report;
	/** The engagement rate and the sessions, grouped by the breakdown dimension. */
	groupedEngagementReport?: Report;
	/** The Key action events for the whole site. */
	aggregatedEventsReport?: Report;
	/** The engagement rate and the sessions for the whole site. */
	aggregatedEngagementReport?: Report;
}

/**
 * Builds the two rows one dimension value adds to a grouped report.
 *
 * @since n.e.x.t
 *
 * @param {string}        dimensionValue       The dimension value the rows belong to.
 * @param {Array<string>} currentMetricValues  The metric values for the current period.
 * @param {Array<string>} previousMetricValues The metric values for the previous period.
 * @return {Array<Object>} The two grouped report rows, the current period first.
 */
export function buildBreakdownReportRows(
	dimensionValue: string,
	currentMetricValues: string[],
	previousMetricValues: string[]
): ReportRow[] {
	return [ 'date_range_0', 'date_range_1' ].map( ( dateRange, index ) => ( {
		dimensionValues: [ { value: dimensionValue }, { value: dateRange } ],
		metricValues: ( index === 0
			? currentMetricValues
			: previousMetricValues
		).map( ( metricValue ) => ( { value: metricValue } ) ),
	} ) );
}

/**
 * Builds the two totals rows an aggregated report carries.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} currentMetricValues  The metric values for the current period.
 * @param {Array<string>} previousMetricValues The metric values for the previous period.
 * @return {Array<Object>} The two totals rows, the current period first.
 */
export function buildAggregatedTotalsRows(
	currentMetricValues: string[],
	previousMetricValues: string[]
): ReportRow[] {
	return [ 'date_range_0', 'date_range_1' ].map( ( dateRange, index ) => ( {
		dimensionValues: [ { value: dateRange } ],
		metricValues: ( index === 0
			? currentMetricValues
			: previousMetricValues
		).map( ( metricValue ) => ( { value: metricValue } ) ),
	} ) );
}

/**
 * Answers every Analytics report request with the report a Site Goals PDF
 * loader asked for.
 *
 * The report store removes `reportID` before the request goes out, so the mock
 * cannot tell the reports apart by name. It reads what each request asks for
 * instead. Only the discovery report carries the `emptyFilter` filter type.
 * Only the grouped reports carry the breakdown dimension. Only the engagement
 * reports ask for the engagement rate.
 *
 * @since n.e.x.t
 *
 * @param {Object} reports The Analytics report bodies to answer with.
 * @return {void}
 */
export function provideSiteGoalsPDFReports(
	reports: SiteGoalsPDFReportFixtures
): void {
	fetchMock.get(
		analyticsReportEndpoint,
		( requestURL ) => {
			const decodedURL = decodeURIComponent( String( requestURL ) );

			if ( decodedURL.includes( 'emptyFilter' ) ) {
				return { body: reports.discoveryReport ?? {}, status: 200 };
			}

			const isEngagementReport = decodedURL.includes(
				'metrics[0][name]=engagementRate'
			);

			if ( decodedURL.includes( 'dimensions[0][name]=customEvent:' ) ) {
				return {
					body:
						( isEngagementReport
							? reports.groupedEngagementReport
							: reports.groupedEventsReport ) ?? {},
					status: 200,
				};
			}

			return {
				body:
					( isEngagementReport
						? reports.aggregatedEngagementReport
						: reports.aggregatedEventsReport ) ?? {},
				status: 200,
			};
		},
		{ overwriteRoutes: true }
	);
}

/**
 * Puts the detected conversion events into the Analytics 4 settings store.
 *
 * The `MODULES_ANALYTICS_4` store keeps the first settings it receives, so each
 * test sets its own events instead of replacing a shared set.
 *
 * @since n.e.x.t
 *
 * @param {Object}        registry       The WordPress data registry the test runs against.
 * @param {Array<string>} detectedEvents The detected conversion event names.
 * @return {void}
 */
export function provideDetectedEvents(
	registry: Registry,
	detectedEvents: string[]
): void {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { detectedEvents } );
}

/**
 * Runs a Site Goals PDF loader with the fixed test date range and a fresh
 * abort signal.
 *
 * @since n.e.x.t
 *
 * @param {Function} loader                    The Site Goals PDF loader to run.
 * @param {Object}   registry                  The WordPress data registry the Site Goals PDF loader runs against.
 * @param {Object}   [options]                 Site Goals PDF loader run options.
 * @param {boolean}  [options.isAborted=false] Whether the signal is already aborted when the loader runs.
 * @return {Promise<Object>} What the Site Goals PDF loader returned.
 */
export function runSiteGoalsPDFLoader< Data >(
	loader: ( params: GetPDFDataParams ) => Promise< Data >,
	registry: Registry,
	{ isAborted = false }: { isAborted?: boolean } = {}
): Promise< Data > {
	const controller = new AbortController();

	if ( isAborted ) {
		controller.abort();
	}

	return loader( {
		registry,
		dates: SITE_GOALS_PDF_TEST_DATES,
		signal: controller.signal,
		viewOnly: false,
	} );
}
