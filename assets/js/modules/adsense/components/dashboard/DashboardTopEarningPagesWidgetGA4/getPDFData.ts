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
import { getTopEarningPagesReportOptions } from './reportOptions';

/**
 * Data the Top earning pages PDF widget renders.
 */
export interface TopEarningPagesPDFData {
	/** Report rows, the currency code, and the page titles, or `null` when cancelled. */
	data: {
		rows: ReportRow[];
		currencyCode: string;
		titles: Record< string, string >;
	} | null;
}

/**
 * Loads the report rows, currency code, and page titles for the Top earning
 * pages PDF widget.
 *
 * Resolves the linked AdSense account ID, loads the Top earning pages report,
 * then a second report that matches each page path to its title. Passes the
 * abort signal to both requests and returns `{ data: null }` as soon as the
 * signal aborts, so cancelling the export stops the work and the widget renders
 * its empty state.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return The report rows, currency code, and the page-path-to-title map.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< TopEarningPagesPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	// The linked account ID lives in the AdSense settings, and the PDF export
	// path does not otherwise resolve them (eligibility only checks Analytics'
	// `adSenseLinked`). Resolve them before reading the ID, or it can be
	// undefined and the report queries a malformed `Google AdSense account
	// (undefined)` ad source, returning an empty or wrong report.
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

	if ( pagePaths.length === 0 ) {
		return { data: { rows, currencyCode, titles: {} } };
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
		},
	};
}
