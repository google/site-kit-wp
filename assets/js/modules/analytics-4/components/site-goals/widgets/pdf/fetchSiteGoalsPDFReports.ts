/**
 * Site Goals PDF report requests.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { SiteGoalsPDFReportOptions } from './reportOptions';
import { ShapeSiteGoalsPDFDataArgs } from './shapeSiteGoalsPDFData';

/** What one `fetchGetReport` call returns. */
interface FetchAnalyticsReportResult {
	/** The Analytics report, or `undefined` when the request failed. */
	response?: Report;
	/** The error the request returned, or `undefined` when the request succeeded. */
	error?: { message: string };
}

/**
 * The Analytics reports one Site Goals PDF section needs. The Key action
 * events and the engagement metrics are each requested with no dimension, for
 * the section's whole-site fallback card. When the property has the breakdown
 * dimension, each is requested again grouped by that dimension, so the section
 * can render a card per group.
 */
export type SiteGoalsPDFReports = Pick<
	ShapeSiteGoalsPDFDataArgs,
	| 'eventsReport'
	| 'engagementReport'
	| 'aggregatedEventsReport'
	| 'aggregatedEngagementReport'
>;

/**
 * Makes the Analytics report requests one Site Goals PDF section needs, in
 * parallel, and returns the reports.
 *
 * Throws when any one of the requests fails. The export function catches
 * errors and omits the widget's section from the PDF report. A cancel is not
 * a failure, so a cancelled export receives no report and no error (eg. an
 * empty object).
 *
 * @since n.e.x.t
 *
 * @param {Object}      params                         Analytics report request parameters.
 * @param {Object}      params.registry                WordPress data registry.
 * @param {AbortSignal} params.signal                  Signal that cancels the PDF export.
 * @param {?Object}     params.groupedReportOptions    Site Goals PDF report options that include the breakdown dimension, or `null` to skip the grouped reports.
 * @param {Object}      params.aggregatedReportOptions Site Goals PDF report options with no breakdown dimension.
 * @return {Promise<Object>} The Analytics reports, under the property names `shapeSiteGoalsPDFData` expects, or no report when the export is cancelled.
 */
export default async function fetchSiteGoalsPDFReports( {
	registry,
	signal,
	groupedReportOptions,
	aggregatedReportOptions,
}: {
	registry: GetPDFDataParams[ 'registry' ];
	signal: AbortSignal;
	groupedReportOptions: SiteGoalsPDFReportOptions | null;
	aggregatedReportOptions: SiteGoalsPDFReportOptions;
} ): Promise< SiteGoalsPDFReports > {
	const { fetchGetReport } = registry.dispatch( MODULES_ANALYTICS_4 );

	const groupedOptions = groupedReportOptions
		? [
				groupedReportOptions.eventsReportOptions,
				groupedReportOptions.engagementReportOptions,
		  ]
		: [];

	const reportResults: FetchAnalyticsReportResult[] = await Promise.all(
		[
			...groupedOptions,
			aggregatedReportOptions.eventsReportOptions,
			aggregatedReportOptions.engagementReportOptions,
		].map( ( reportOptions ) =>
			fetchGetReport( reportOptions, { signal } )
		)
	);

	const reportError = reportResults.find(
		( { error } ) => error !== undefined
	)?.error;

	if ( reportError ) {
		// A cancelled export rejects every in-flight request. Returning here
		// keeps cancellation out of the failure path, and the loader's own
		// `signal.aborted` check turns it into `{ data: null }`.
		if ( signal.aborted ) {
			return {};
		}

		throw new Error(
			`Site Kit: Site Goals report unavailable. ${ reportError.message }`
		);
	}

	const reports = reportResults.map( ( { response } ) => response );

	const [ eventsReport, engagementReport ] = groupedOptions.length
		? reports
		: [];
	const [ aggregatedEventsReport, aggregatedEngagementReport ] =
		reports.slice( groupedOptions.length );

	return {
		eventsReport,
		engagementReport,
		aggregatedEventsReport,
		aggregatedEngagementReport,
	};
}
