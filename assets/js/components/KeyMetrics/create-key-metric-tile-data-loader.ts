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
	PDFReportDates,
} from '@/js/googlesitekit/widgets/types';

/**
 * One report a tile needs: the module datastore to fetch from and the report
 * options to request.
 *
 * @since n.e.x.t
 */
export interface TileReportRequest {
	/** The module datastore name, e.g. `MODULES_ANALYTICS_4`. */
	moduleStore: string;
	/** The report options passed to the store's `fetchGetReport` action. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Report options differ per module and are validated by each store.
	options: any;
}

/** The result of one `fetchGetReport` dispatch. */
interface FetchReportResult {
	/** The report, or `undefined` when the fetch failed. */
	response?: unknown;
	/** The fetch error, or `undefined` on success. */
	error?: unknown;
}

/**
 * Builds a `getTileData` loader for one Key Metrics PDF tile.
 *
 * The returned loader fetches every report from `buildReports` in parallel,
 * threading the export's abort `signal` through each request, then hands the
 * resolved report responses (in the same order) to `extract`, which normalises
 * them into the shape the tile's `TileComponent` consumes. It short-circuits to
 * `null` when the export is canceled, and throws when any report fails so the
 * aggregate loader can render a "Data unavailable" placeholder for just that
 * tile.
 *
 * @since n.e.x.t
 *
 * @param buildReports Returns the reports to fetch for the given date range.
 * @param extract      Maps the resolved report responses to the tile's data.
 * @return A `getTileData( { registry, dates, signal } )` loader.
 */
export default function createKeyMetricTileDataLoader< TData >(
	buildReports: ( dates: PDFReportDates ) => TileReportRequest[],
	extract: ( reports: unknown[] ) => TData
): ( params: GetPDFDataParams ) => Promise< TData | null > {
	return async function getTileData( {
		registry,
		dates,
		signal,
	}: GetPDFDataParams ): Promise< TData | null > {
		if ( signal.aborted ) {
			return null;
		}

		const requests = buildReports( dates );

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

		return extract( results.map( ( result ) => result.response ) );
	};
}
