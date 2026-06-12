/**
 * ModulePopularPagesWidgetGA4 PDF data loader.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	Report,
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import { getPopularPagesReportOptions } from './reportOptions';

export interface GetPDFDataParams {
	registry: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry actions are loosely typed in this codebase.
		dispatch: ( storeName: string ) => any;
	};
	dates: Pick< ReportOptions, 'startDate' | 'endDate' >;
	signal: AbortSignal;
}

export interface PopularPagesPDFData {
	data: {
		rows: ReportRow[];
		titles: Record< string, string >;
	} | null;
}

// The page titles report mirrors the `getPageTitles` resolver in the
// `modules/analytics-4` report datastore, so the PDF resolves the same titles
// the dashboard shows. The resolver requests five times as many rows as there
// are page paths.
const PAGE_TITLES_REQUEST_MULTIPLIER = 5;
const PAGE_TITLES_REPORT_ID =
	'analytics-4_get-page-titles_store:selector_options';

/**
 * Builds the page titles report args for the given page paths.
 *
 * Mirrors the options the `getPageTitles` resolver builds, so the PDF pairs
 * each page path with the same title the dashboard's Most popular pages widget
 * shows.
 *
 * @since n.e.x.t
 *
 * @param dates     Report date range.
 * @param pagePaths Page paths from the main report rows.
 * @return GA4 getReport args for the page titles report.
 */
function getPageTitlesReportOptions(
	dates: Pick< ReportOptions, 'startDate' | 'endDate' >,
	pagePaths: string[]
): ReportOptions {
	return {
		startDate: dates.startDate,
		endDate: dates.endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		dimensionFilters: { pagePath: [ ...pagePaths ].sort() },
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: PAGE_TITLES_REQUEST_MULTIPLIER * pagePaths.length,
		reportID: PAGE_TITLES_REPORT_ID,
	};
}

/**
 * Loads the GA4 report and page titles for the Top content over time PDF widget.
 *
 * Fetches the Most popular pages report, then a second report that pairs each
 * page path with its resolved title. Both fetches forward the abort signal so a
 * cancelled export stops its requests. The loader also returns early between
 * awaits when the signal is aborted, returning `{ data: null }` so the widget
 * renders its empty state.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return Resolved rows and the page path to title map.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< PopularPagesPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const args = getPopularPagesReportOptions( dates );

	// TODO(#12699): `fetchGetReport` forwards the trailing `{ signal }` to the
	// request once #12699 lands. Until then the options object is ignored, and
	// the `signal.aborted` checks below still stop the loader between awaits.
	const { response: report }: { response?: Report } = await registry
		.dispatch( MODULES_ANALYTICS_4 )
		.fetchGetReport( args, { signal } );

	if ( signal.aborted ) {
		return { data: null };
	}

	const rows = report?.rows ?? [];

	const pagePaths: string[] = [];
	rows.forEach( ( row ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value;
		if ( pagePath && ! pagePaths.includes( pagePath ) ) {
			pagePaths.push( pagePath );
		}
	} );

	if ( pagePaths.length === 0 ) {
		return { data: { rows: [], titles: {} } };
	}

	const { response: titlesReport }: { response?: Report } = await registry
		.dispatch( MODULES_ANALYTICS_4 )
		.fetchGetReport( getPageTitlesReportOptions( dates, pagePaths ), {
			signal,
		} );

	if ( signal.aborted ) {
		return { data: null };
	}

	const titles: Record< string, string > = {};
	( titlesReport?.rows ?? [] ).forEach( ( row ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value;
		const pageTitle = row.dimensionValues?.[ 1 ]?.value;
		if ( pagePath && ! titles[ pagePath ] ) {
			titles[ pagePath ] = pageTitle ?? '';
		}
	} );

	// Fall back to a placeholder for any page path the titles report missed,
	// matching the dashboard's `getPageTitles` behaviour.
	pagePaths.forEach( ( pagePath ) => {
		if ( ! titles[ pagePath ] ) {
			titles[ pagePath ] = __( '(unknown)', 'google-site-kit' );
		}
	} );

	return { data: { rows, titles } };
}
