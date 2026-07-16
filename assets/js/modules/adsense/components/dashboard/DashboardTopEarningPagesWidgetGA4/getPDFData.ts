/**
 * DashboardTopEarningPagesWidgetGA4 PDF data loader.
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
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import {
	getPagePaths,
	getPageTitleMap,
	getPageTitlesReportOptions,
} from '@/js/modules/analytics-4/utils/page-titles-report';
import { getTopEarningPagesReportOptions } from './getTopEarningPagesReportOptions';

/**
 * Data the Top earning pages PDF widget renders.
 */
export interface TopEarningPagesPDFData {
	/** Rows of the Top earning pages report. */
	rows: ReportRow[];
	/** Currency code from the report metadata, for formatting the earnings. */
	currencyCode: string;
	/** Map of page path to page title. */
	titles: Record< string, string >;
	/** Map of page path to its Analytics report link. Empty on a view-only dashboard, where each page title shows as plain text. */
	links: Record< string, string >;
}

/**
 * What `getPDFData` returns.
 *
 * The shared PDF `getData` contract wraps a widget's payload in a `data` key,
 * which the report mapper hands to the widget's `Component` as its `data` prop.
 * The payload is `null` when the export is cancelled.
 */
interface GetPDFDataResult {
	data: TopEarningPagesPDFData | null;
}

/**
 * Maps each page path to its Analytics report link.
 *
 * Builds the same All pages and screens report link the dashboard widget shows
 * for each page. The PDF component renders each page title as this link.
 *
 * @since n.e.x.t
 *
 * @param registry  WordPress data registry.
 * @param dates     Report date range.
 * @param pagePaths Page paths from the main report rows.
 * @return Map of page path to its Analytics report link.
 */
function getPageLinkMap(
	registry: GetPDFDataParams[ 'registry' ],
	dates: GetPDFDataParams[ 'dates' ],
	pagePaths: string[]
): Record< string, string > {
	const analytics = registry.select( MODULES_ANALYTICS_4 );
	const { startDate, endDate } = dates;
	const links: Record< string, string > = {};

	pagePaths.forEach( ( pagePath ) => {
		links[ pagePath ] =
			analytics.getServiceReportURL( 'all-pages-and-screens', {
				filters: { unifiedPagePathScreen: pagePath },
				dates: { startDate, endDate },
			} ) ?? '';
	} );

	return links;
}

/**
 * Loads the report rows, currency code, and page titles for the Top earning
 * pages PDF widget.
 *
 * Resolves the linked AdSense account ID, loads the Top earning pages report,
 * then a second report that matches each page path to its title. Builds an
 * Analytics report link for each page, the same link the dashboard widget
 * shows. For a view-only user, the loader builds no links, because the
 * dashboard widget shows the page title as plain text. Passes the cancellation
 * signal to both requests and returns `{ data: null }` when the signal fires.
 * Canceling the export stops the work, and the widget renders its empty
 * state.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @param params.viewOnly Whether the export runs on a view-only dashboard.
 * @return The report rows, currency code, page titles, and per-page links.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
	viewOnly,
}: GetPDFDataParams ): Promise< GetPDFDataResult > {
	if ( signal.aborted ) {
		return { data: null };
	}

	// The linked account ID lives in the AdSense settings, and the PDF export
	// path doesn't otherwise resolve them (eligibility only checks the
	// Analytics `adSenseLinked` setting). Resolve them before reading the ID,
	// or it stays `undefined` and the report queries a malformed `Google
	// AdSense account (undefined)` ad source, returning an empty or wrong
	// report.
	await registry.resolveSelect( MODULES_ADSENSE ).getSettings();

	if ( signal.aborted ) {
		return { data: null };
	}

	const adSenseAccountID = registry.select( MODULES_ADSENSE ).getAccountID();

	const args = getTopEarningPagesReportOptions( dates, { adSenseAccountID } );

	// The store caches `getReport` by its arguments, so after a cancelled or
	// failed run the next call returns `undefined` without fetching. Invalidate
	// the resolution first to force a fresh fetch.
	const { invalidateResolution } = registry.dispatch( MODULES_ANALYTICS_4 );
	invalidateResolution( 'getReport', [ args, { signal } ] );

	const report: Report | undefined = await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getReport( args, { signal } );

	if ( signal.aborted ) {
		return { data: null };
	}

	const rows = report?.rows ?? [];
	const currencyCode = report?.metadata?.currencyCode ?? '';
	const pagePaths = getPagePaths( report );

	// For a view-only user, the loader builds no page links, so each page title
	// renders as plain text.
	const links = viewOnly ? {} : getPageLinkMap( registry, dates, pagePaths );

	if ( pagePaths.length === 0 ) {
		return { data: { rows, currencyCode, titles: {}, links } };
	}

	const titlesArgs = getPageTitlesReportOptions( dates, pagePaths );
	invalidateResolution( 'getReport', [ titlesArgs, { signal } ] );

	const titlesReport: Report | undefined = await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getReport( titlesArgs, { signal } );

	if ( signal.aborted ) {
		return { data: null };
	}

	return {
		data: {
			rows,
			currencyCode,
			titles: getPageTitleMap( pagePaths, titlesReport ),
			links,
		},
	};
}
