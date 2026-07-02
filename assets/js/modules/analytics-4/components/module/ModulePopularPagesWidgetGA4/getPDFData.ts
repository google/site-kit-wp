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
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import {
	getPagePaths,
	getPageTitleMap,
	getPageTitlesReportOptions,
} from '@/js/modules/analytics-4/utils/page-titles-report';
import { getFullURL } from '@/js/util';
import { getPopularPagesReportArgs } from './reportOptions';

/**
 * Links for one page row: the entity dashboard URL for the title, and the
 * page's own public URL for the URL line.
 */
export interface PopularPageLinks {
	detailsURL: string;
	permaLink: string;
}

/**
 * Data the Top content over time PDF widget renders.
 */
export interface PopularPagesPDFData {
	/** Report rows, the page titles, and the per-page links, or `null` when cancelled. */
	data: {
		rows: ReportRow[];
		titles: Record< string, string >;
		links: Record< string, PopularPageLinks >;
	} | null;
}

/**
 * Maps each page path to its entity dashboard URL and public URL.
 *
 * The title links to the page's Site Kit detail view, the same entity dashboard
 * link the dashboard builds for a page. The URL line links to the page itself.
 *
 * @since 1.182.0
 *
 * @param registry  WordPress data registry.
 * @param pagePaths Page paths from the main report rows.
 * @return Map of page path to its entity dashboard URL and public URL.
 */
function getPopularPageLinkMap(
	registry: GetPDFDataParams[ 'registry' ],
	pagePaths: string[]
): Record< string, PopularPageLinks > {
	const coreSite = registry.select( CORE_SITE );
	const siteURL = coreSite.getReferenceSiteURL();

	const links: Record< string, PopularPageLinks > = {};

	pagePaths.forEach( ( pagePath ) => {
		const permaLink = getFullURL( siteURL, pagePath );
		links[ pagePath ] = {
			detailsURL:
				coreSite.getAdminURL( 'googlesitekit-dashboard', {
					permaLink,
				} ) ?? '',
			permaLink,
		};
	} );

	return links;
}

/**
 * Loads the report rows and page titles for the Top content over time PDF widget.
 *
 * Loads the Most popular pages report, then a second report that matches each
 * page path to its title. Passes the abort signal to both requests and returns
 * `{ data: null }` as soon as the signal aborts, so cancelling the export stops
 * the work and the widget renders its empty state.
 *
 * @since 1.182.0
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return The report rows and the page-path-to-title map.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< PopularPagesPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const args = getPopularPagesReportArgs( dates );

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
	const pagePaths = getPagePaths( report );
	const links = getPopularPageLinkMap( registry, pagePaths );

	if ( pagePaths.length === 0 ) {
		return { data: { rows, titles: {}, links } };
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
			titles: getPageTitleMap( pagePaths, titlesReport ),
			links,
		},
	};
}
