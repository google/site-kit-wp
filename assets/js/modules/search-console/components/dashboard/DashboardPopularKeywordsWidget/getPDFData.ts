/**
 * DashboardPopularKeywordsWidget PDF data loader.
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
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { generateDateRangeArgs } from '@/js/modules/search-console/util';
import { getPopularKeywordsReportArgs } from './reportOptions';

/**
 * One row of the Top search queries report.
 */
export interface PopularKeywordRow {
	/** Dimension values. The query report has one dimension, so `keys[ 0 ]` is the search query. */
	keys: string[];
	/** Number of clicks for the query. */
	clicks: number;
	/** Number of impressions for the query. */
	impressions: number;
}

/**
 * Data the Top search queries PDF widget renders.
 */
export interface PopularKeywordsPDFData {
	/** Report rows and the per-query links, or `null` when the export is canceled or the report has no rows. */
	data: {
		/** The Top search queries report rows. */
		rows: PopularKeywordRow[];
		/** Map of search query to its Search Console report link. */
		links: Record< string, string >;
	} | null;
}

/**
 * Maps each search query to its Search Console report link.
 *
 * Builds the same Search Console report link the dashboard widget shows for each
 * query. The PDF component renders each query as this link.
 *
 * @since n.e.x.t
 *
 * @param registry WordPress data registry.
 * @param dates    Report date range.
 * @param rows     Report rows.
 * @return Map of search query to its Search Console report link.
 */
function getQueryLinkMap(
	registry: GetPDFDataParams[ 'registry' ],
	dates: GetPDFDataParams[ 'dates' ],
	rows: PopularKeywordRow[]
): Record< string, string > {
	const searchConsole = registry.select( MODULES_SEARCH_CONSOLE );
	const dateRangeArgs = generateDateRangeArgs( dates );
	const links: Record< string, string > = {};

	rows.forEach( ( row ) => {
		// The query report has one dimension, so the first key is the query.
		const query = row.keys?.[ 0 ];
		if ( query && ! ( query in links ) ) {
			links[ query ] =
				searchConsole.getServiceReportURL( {
					...dateRangeArgs,
					query: `!${ query }`,
				} ) ?? '';
		}
	} );

	return links;
}

/**
 * Loads the report rows and per-query links for the Top search queries PDF widget.
 *
 * Loads the Top search queries report and passes the abort signal to the
 * request. Builds a Search Console report link for each query, the same link the
 * dashboard widget shows. Returns `{ data: null }` when the signal aborts or the
 * report has no rows, so the report document skips this widget.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return The report rows and the per-query links.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< PopularKeywordsPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const args = getPopularKeywordsReportArgs( dates );

	// The store caches `getReport` by its arguments, so after a cancelled or
	// failed run the next call returns `undefined` without fetching. Invalidate
	// the resolution first to force a fresh fetch.
	const { invalidateResolution } = registry.dispatch(
		MODULES_SEARCH_CONSOLE
	);
	invalidateResolution( 'getReport', [ args, { signal } ] );

	const report: PopularKeywordRow[] | undefined = await registry
		.resolveSelect( MODULES_SEARCH_CONSOLE )
		.getReport( args, { signal } );

	if ( signal.aborted ) {
		return { data: null };
	}

	const rows = report ?? [];

	// With no rows the widget has nothing to render. `data: null` lets the
	// report document skip the widget, so the PDF holds no empty section.
	if ( rows.length === 0 ) {
		return { data: null };
	}

	return { data: { rows, links: getQueryLinkMap( registry, dates, rows ) } };
}
