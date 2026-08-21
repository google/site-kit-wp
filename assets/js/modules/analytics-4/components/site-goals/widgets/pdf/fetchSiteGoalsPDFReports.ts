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
	/** The error the request returned, or `undefined` when the request worked. */
	error?: { message: string };
}

/**
 * The four Analytics reports one Site Goals PDF section reads: the Key action
 * events and the engagement metrics, each grouped by the breakdown dimension
 * and again for the whole site.
 */
export type SiteGoalsPDFReports = Pick<
	ShapeSiteGoalsPDFDataArgs,
	| 'eventsReport'
	| 'engagementReport'
	| 'aggregatedEventsReport'
	| 'aggregatedEngagementReport'
>;

/**
 * Requests the four Analytics reports one Site Goals PDF section reads, in
 * parallel.
 *
 * Throws when any one of the four requests fails. The export catches that
 * error and leaves the widget's section out of the PDF report.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params                         Analytics report request parameters.
 * @param {Object}      params.registry                WordPress data registry.
 * @param {AbortSignal} params.signal                  Signal that cancels the PDF export.
 * @param {Object}      params.groupedReportOptions    Site Goals PDF report options that carry the breakdown dimension.
 * @param {Object}      params.aggregatedReportOptions Site Goals PDF report options that carry no breakdown dimension.
 * @return {Promise<Object>} The four Analytics reports, under the property names `shapeSiteGoalsPDFData` reads.
 */
export default async function fetchSiteGoalsPDFReports( {
	registry,
	signal,
	groupedReportOptions,
	aggregatedReportOptions,
}: {
	registry: GetPDFDataParams[ 'registry' ];
	signal: AbortSignal;
	groupedReportOptions: SiteGoalsPDFReportOptions;
	aggregatedReportOptions: SiteGoalsPDFReportOptions;
} ): Promise< SiteGoalsPDFReports > {
	const { fetchGetReport } = registry.dispatch( MODULES_ANALYTICS_4 );

	const reportResults: FetchAnalyticsReportResult[] = await Promise.all(
		[
			groupedReportOptions.eventsReportOptions,
			groupedReportOptions.engagementReportOptions,
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
		throw new Error(
			`Site Kit: Site Goals report unavailable. ${ reportError.message }`
		);
	}

	const [
		eventsReport,
		engagementReport,
		aggregatedEventsReport,
		aggregatedEngagementReport,
	] = reportResults.map( ( { response } ) => response );

	return {
		eventsReport,
		engagementReport,
		aggregatedEventsReport,
		aggregatedEngagementReport,
	};
}
