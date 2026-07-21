/**
 * Key Metrics aggregate PDF data loader.
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
 * External dependencies
 */
import { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	GetPDFDataParams,
	PDFDataLoaderParams,
} from '@/js/googlesitekit/widgets/types';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

/**
 * The `KEY_METRICS_WIDGETS` entry fields this loader reads. The map lives in a
 * `.js` file, so this types just the fields used here and adds a string index so
 * entries can be looked up by slug.
 */
interface KeyMetricPDFEntry {
	/** The tile heading. */
	title: string;
	/** The tile's PDF export config, present only for metrics with a PDF tile. */
	pdfTile?: {
		/** The tile's `@react-pdf/renderer` component, `lazyWithPreload`-wrapped. */
		TileComponent: ComponentType< never > & {
			preload?: () => Promise< {
				default: ComponentType< never >;
			} >;
		};
		/** Resolves the tile's data, or `null` when the caller cancels the export. */
		getTileData: ( params: PDFDataLoaderParams ) => Promise< unknown >;
	};
}

const keyMetricsWidgets = KEY_METRICS_WIDGETS as Record<
	string,
	KeyMetricPDFEntry
>;

/**
 * The props shape the aggregate component spreads into a tile: its `title` plus
 * the fields the tile's `getTileData` resolved. The map above stores each tile as
 * `ComponentType< never >` so every tile's own props shape fits it, so a
 * component crossing into the rendered tile is converted to this type.
 */
type TileRenderComponent = ComponentType< Record< string, unknown > >;

/**
 * One rendered Key Metrics tile: enough to render its `TileComponent`, plus the
 * `data` it consumes (or `null` when that tile's data failed to load).
 *
 * @since n.e.x.t
 */
export interface KeyMetricsPDFTile {
	/** The key metric slug, e.g. `KM_ANALYTICS_NEW_VISITORS`. */
	slug: string;
	/** The tile heading, from the `KEY_METRICS_WIDGETS` entry's `title`. */
	title: string;
	/** The tile's `@react-pdf/renderer` component. */
	TileComponent: TileRenderComponent;
	/** The normalised tile data, or `null` when this tile's data failed to load. */
	data: unknown;
}

/**
 * Resolved output of the Key Metrics aggregate loader.
 *
 * @since n.e.x.t
 */
export interface KeyMetricsPDFData {
	/** The tiles to render, or `null` when the export is canceled. */
	data: { tiles: KeyMetricsPDFTile[] } | null;
}

/**
 * Composes the Key Metrics PDF section data from the user's configured tiles.
 *
 * Reads the user's key metric slugs, keeps only those whose `KEY_METRICS_WIDGETS`
 * entry defines a `pdfTile` config (others are skipped silently), and loads each
 * remaining tile's data through its `pdfTile.getTileData`. A single tile's
 * failure is captured as `data: null` so the other tiles still render; the loader
 * throws only when every tile fails. Tiles keep the user's configured order.
 *
 * @since n.e.x.t
 *
 * @param params          Loader parameters.
 * @param params.registry WordPress data registry.
 * @param params.dates    Report date range.
 * @param params.signal   Cancellation signal.
 * @return The Key Metrics tiles, or `{ data: null }` when canceled.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< KeyMetricsPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const keyMetrics: string[] =
		( await registry.resolveSelect( CORE_USER ).getKeyMetrics() ) || [];

	if ( signal.aborted ) {
		return { data: null };
	}

	let failureCount = 0;

	// Only the configured metrics that have a PDF tile config render in the PDF,
	// in the user's configured order. Others are skipped silently.
	const tilePromises: Promise< KeyMetricsPDFTile >[] = [];

	for ( const slug of keyMetrics ) {
		const entry = keyMetricsWidgets[ slug ];
		const pdfTile = entry?.pdfTile;

		if ( ! pdfTile ) {
			continue;
		}

		tilePromises.push(
			( async () => {
				// The tile's `TileComponent` is a `lazyWithPreload` component so
				// `key-metrics-widgets.js` stays free of `@react-pdf/renderer` on
				// the dashboard bundle. Preload it here and hand its resolved
				// default to the aggregate component, which renders it directly
				// (the react-pdf renderer does not honour Suspense).
				let TileComponent =
					pdfTile.TileComponent as TileRenderComponent;

				try {
					const [ data, resolved ] = await Promise.all( [
						pdfTile.getTileData( { registry, dates, signal } ),
						typeof pdfTile.TileComponent.preload === 'function'
							? pdfTile.TileComponent.preload()
							: Promise.resolve( {
									default: pdfTile.TileComponent,
							  } ),
					] );
					TileComponent = resolved.default as TileRenderComponent;
					return { slug, title: entry.title, TileComponent, data };
				} catch {
					failureCount += 1;
					return {
						slug,
						title: entry.title,
						TileComponent,
						data: null,
					};
				}
			} )()
		);
	}

	const tiles = await Promise.all( tilePromises );

	if ( signal.aborted ) {
		return { data: null };
	}

	// With no tiles to render, omit the section rather than render an empty one,
	// matching how the report drops a widget with no data.
	if ( tiles.length === 0 ) {
		return { data: null };
	}

	// Every tile failing leaves the section with no data, so surface it as an
	// error rather than an empty section.
	if ( failureCount === tiles.length ) {
		throw new Error( 'All Key Metrics PDF tiles failed to load.' );
	}

	return { data: { tiles } };
}
