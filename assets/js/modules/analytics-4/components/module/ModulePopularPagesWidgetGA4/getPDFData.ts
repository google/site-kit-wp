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
 * Links for one page row: the link the page title points to, and the page's own
 * public URL for the URL line.
 */
export interface PopularPageLinks {
	/** The link the page title points to: the Analytics report for an administrator, the page's entity dashboard for a view-only user. */
	titleURL: string;
	/** The page's own public URL, which the URL line links to. */
	permaLink: string;
}

/**
 * Data the Top content over time PDF widget renders.
 */
export interface PopularPagesPDFData {
	/** Report rows, the page titles, and the per-page links, or `null` when the user cancels the export or the report has no rows. */
	data: {
		/** Rows of the Most popular pages report. */
		rows: ReportRow[];
		/** Map of page path to page title. */
		titles: Record< string, string >;
		/** Map of page path to its title link and public URL. */
		links: Record< string, PopularPageLinks >;
	} | null;
}

/**
 * Maps each page path to its title link and public URL.
 *
 * The title links to the same All pages and screens report the dashboard widget
 * links to for an administrator, and to the page's entity dashboard for a
 * view-only user, the same `serviceURL || detailsURL` fallback the dashboard
 * widget's `DetailsPermaLinks` renders. The URL line links to the page itself
 * for every user.
 *
 * @since 1.182.0
 * @since n.e.x.t Links the title to the Analytics report for an administrator and to the entity dashboard for a view-only user.
 *
 * @param registry  WordPress data registry.
 * @param dates     Report date range.
 * @param pagePaths Page paths from the main report rows.
 * @param viewOnly  Whether the export runs on a view-only dashboard.
 * @return Map of page path to its title link and public URL.
 */
function getPopularPageLinkMap(
	registry: GetPDFDataParams[ 'registry' ],
	dates: GetPDFDataParams[ 'dates' ],
	pagePaths: string[],
	viewOnly: boolean
): Record< string, PopularPageLinks > {
	const coreSite = registry.select( CORE_SITE );
	const siteURL = coreSite.getReferenceSiteURL();
	const analytics = registry.select( MODULES_ANALYTICS_4 );
	const { startDate, endDate } = dates;

	const links: Record< string, PopularPageLinks > = {};

	pagePaths.forEach( ( pagePath ) => {
		const permaLink = getFullURL( siteURL, pagePath );

		// An administrator's title links to the Analytics report. A view-only
		// user has no service link, so the title falls back to the page's entity
		// dashboard, the same `serviceURL || detailsURL` fallback the dashboard
		// widget renders for that user.
		const serviceURL = viewOnly
			? null
			: analytics.getServiceReportURL( 'all-pages-and-screens', {
					filters: { unifiedPagePathScreen: pagePath },
					dates: { startDate, endDate },
			  } );

		const detailsURL = coreSite.getAdminURL( 'googlesitekit-dashboard', {
			permaLink,
		} );

		links[ pagePath ] = {
			titleURL: serviceURL || detailsURL || '',
			permaLink,
		};
	} );

	return links;
}

/**
 * Loads the report rows and page titles for the Top content over time PDF widget.
 *
 * Loads the Most popular pages report, then a second report that matches each
 * page path to its title. Passes the abort signal to both requests. Returns
 * `{ data: null }` when the signal aborts or the report has no rows, so the
 * report document skips this widget.
 *
 * @since 1.182.0
 * @since 1.183.0 Returns null data when the report has no rows.
 * @since n.e.x.t Links each title to the Analytics report for an administrator and to the entity dashboard for a view-only user.
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @param params.viewOnly Whether the export runs on a view-only dashboard.
 * @return The report rows and the page-path-to-title map.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
	viewOnly,
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

	// With no rows the widget has nothing to render. `data: null` lets the
	// report document skip the widget, so the PDF holds no empty section.
	if ( rows.length === 0 ) {
		return { data: null };
	}

	const pagePaths = getPagePaths( report );
	const links = getPopularPageLinkMap( registry, dates, pagePaths, viewOnly );

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
