/**
 * Key Metrics PDF tile data loader factory.
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
import {
	GetPDFDataParams,
	PDFDataLoaderParams,
	PDFReportDates,
} from '@/js/googlesitekit/widgets/types';

/**
 * One report a tile needs: the module datastore to fetch from and the report
 * options to request.
 *
 * @since 1.184.0
 */
export interface TileReportRequest {
	/** The module datastore name, e.g. `MODULES_ANALYTICS_4`. */
	moduleStore: string;
	/** The report options passed to the store's `fetchGetReport` action. */
	options: unknown;
}

/** The result of one `fetchGetReport` dispatch. */
interface FetchReportResult {
	/** The report, or `undefined` when the fetch failed. */
	response?: unknown;
	/** The fetch error, or `undefined` on success. */
	error?: unknown;
}

/**
 * Context `extract` receives alongside the resolved reports, for tiles that
 * build a row's link (e.g. from `registry` and `dates`) rather than only
 * reading the report response.
 *
 * @since 1.186.0
 */
export type TileExtractContext = Pick<
	GetPDFDataParams,
	'registry' | 'dates' | 'viewOnly'
>;

/**
 * Builds a `getTileData` loader for one Key Metrics PDF tile.
 *
 * The returned loader fetches every report from `buildReports` in parallel,
 * threading the export's abort `signal` through each request, then hands the
 * resolved report responses (in the same order) to `extract`, which normalises
 * them into the shape the tile's `TileComponent` consumes. It returns `null`
 * early when the export is canceled, and throws when one of those fetched
 * reports fails so the aggregate loader can skip just that tile. `extract`
 * returns `null` when its report has no data, which the aggregate loader treats
 * the same way — the tile is left out of the report entirely.
 *
 * Note this covers only the reports `buildReports` returns. A report a tile
 * resolves inside `buildReports` (e.g. to discover page paths) is fetched via
 * `resolveSelect`, which yields `undefined` rather than throwing on failure, so
 * such a failure reads as no data, not as a thrown error.
 *
 * @since 1.184.0
 * @since 1.186.0 Passes `{ registry, dates, viewOnly }` to `extract` as a second argument.
 *
 * @param buildReports Returns the reports to fetch for the date range. It receives the registry too, so a tile whose report options depend on resolved state can await it; it may return a promise.
 * @param extract      Maps the resolved report responses to the tile's data, or `null` when the report has no data. Receives `{ registry, dates, viewOnly }` as a second argument for tiles that build a row's link.
 * @return A `getTileData( { registry, dates, signal, viewOnly } )` loader.
 */
export default function createKeyMetricTileDataLoader< TData >(
	buildReports: (
		dates: PDFReportDates,
		registry: PDFDataLoaderParams[ 'registry' ]
	) => TileReportRequest[] | Promise< TileReportRequest[] >,
	extract: ( reports: unknown[], context: TileExtractContext ) => TData | null
): (
	params: PDFDataLoaderParams & { viewOnly?: boolean }
) => Promise< TData | null > {
	return async function getTileData( {
		registry,
		dates,
		signal,
		viewOnly = false,
	}: PDFDataLoaderParams & { viewOnly?: boolean } ): Promise< TData | null > {
		if ( signal.aborted ) {
			return null;
		}

		const requests = await buildReports( dates, registry );

		if ( signal.aborted ) {
			return null;
		}

		const results: FetchReportResult[] = await Promise.all(
			requests.map( ( { moduleStore, options } ) =>
				registry
					.dispatch( moduleStore )
					.fetchGetReport( options, { signal } )
			)
		);

		if ( signal.aborted ) {
			return null;
		}

		const failed = results.find( ( result ) => ! result || result.error );
		if ( failed ) {
			throw (
				failed.error ||
				new Error( 'Key Metrics tile report failed to load.' )
			);
		}

		return extract(
			results.map( ( result ) => result.response ),
			{
				registry,
				dates,
				viewOnly,
			}
		);
	};
}
