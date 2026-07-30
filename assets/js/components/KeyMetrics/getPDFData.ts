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
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import {
	GetPDFDataParams,
	PDFDataLoaderParams,
} from '@/js/googlesitekit/widgets/types';
import { KEY_METRICS_PDF_TILES } from './key-metrics-pdf-tiles';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

/**
 * One metric's PDF export configuration. Both maps live in `.js` files, so this
 * types just the fields read here and adds a string index for slug lookups.
 */
interface KeyMetricPDFTileConfig {
	/** The tile's `@react-pdf/renderer` component, `lazyWithPreload`-wrapped. */
	TileComponent: ComponentType< never > & {
		preload?: () => Promise< {
			default: ComponentType< never >;
		} >;
	};
	/** Resolves the tile's data, or `null` when the report has no data. */
	getTileData: ( params: PDFDataLoaderParams ) => Promise< unknown >;
}

const keyMetricsWidgets = KEY_METRICS_WIDGETS as Record<
	string,
	{ title: string }
>;

const keyMetricsPDFTiles = KEY_METRICS_PDF_TILES as Record<
	string,
	KeyMetricPDFTileConfig
>;

/**
 * The props shape the aggregate component spreads into a tile: its `title` plus
 * the fields the tile's `getTileData` resolved. The map above stores each tile as
 * `ComponentType< never >` so every tile's own props shape fits it, so a
 * component is converted to this type as it crosses into the rendered tile.
 */
type TileRenderComponent = ComponentType< Record< string, unknown > >;

/**
 * One rendered Key Metrics tile: enough to render its `TileComponent`, plus the
 * `data` it consumes. Only tiles with data are composed, so `data` is always
 * present — a tile whose report has no data (or failed to load) is left out.
 *
 * @since 1.184.0
 */
export interface KeyMetricsPDFTile {
	/** The key metric slug, e.g. `KM_ANALYTICS_NEW_VISITORS`. */
	slug: string;
	/** The tile heading, from the `KEY_METRICS_WIDGETS` entry's `title`. */
	title: string;
	/** The tile's `@react-pdf/renderer` component. */
	TileComponent: TileRenderComponent;
	/** The normalised tile data the `TileComponent` consumes. */
	data: unknown;
}

/**
 * Resolved output of the Key Metrics aggregate loader.
 *
 * @since 1.184.0
 */
export interface KeyMetricsPDFData {
	/** The tiles to render, or `null` when the export is canceled. */
	data: { tiles: KeyMetricsPDFTile[] } | null;
}

/**
 * Composes the Key Metrics PDF section data from the user's configured tiles.
 *
 * Orders the tiles exactly as the dashboard does: it reads the active widgets of
 * the Key Metrics area, which the widget registry already returns in the
 * dashboard's render order (by widget priority), rather than the user's raw
 * selection order. `viewableModules` scopes those widgets to the modules the
 * current user can view, so a shared dashboard exports the same tiles it shows.
 * It keeps only the widgets that have an entry in `KEY_METRICS_PDF_TILES` (the
 * aggregate section widget and CTA tiles are skipped) and loads each tile's data
 * through its `getTileData`. A tile whose report has no data is left out and the
 * remaining tiles reflow to fill the grid; a tile whose report fails to load is
 * also left out, but when every attempted tile fails that way the loader throws,
 * so a genuine outage surfaces as an export error rather than an empty section.
 * When no tile has data the loader returns `{ data: null }` so the orchestrator
 * omits the whole section.
 *
 * @since 1.184.0
 *
 * @param params                 Loader parameters.
 * @param params.registry        WordPress data registry.
 * @param params.dates           Report date range.
 * @param params.signal          Cancellation signal.
 * @param params.viewableModules The modules the user can view, or `undefined` for the owner.
 * @return The Key Metrics tiles, or `{ data: null }` when canceled or no tile has data.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
	viewableModules,
}: GetPDFDataParams ): Promise< KeyMetricsPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	// Resolve the user's key metrics first: the area's widgets decide whether
	// they are active from `isKeyMetricActive`, which reads this selection.
	await registry.resolveSelect( CORE_USER ).getKeyMetrics();

	if ( signal.aborted ) {
		return { data: null };
	}

	// The registry returns the area's active widgets in the dashboard's render
	// order, so the exported tiles match what the user sees. Scoping to
	// `viewableModules` drops tiles for modules the user cannot view, matching
	// the dashboard; widgets without a PDF tile config (the aggregate section
	// widget, the CTA tiles) are dropped below.
	const orderedSlugs: string[] = registry
		.select( CORE_WIDGETS )
		.getWidgets( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
			// `getWidgets` treats an empty array as "allow nothing", so an owner
			// (or a viewer with no shared modules) passes `undefined` to skip the
			// filter entirely, matching the orchestrator's area discovery.
			modules: viewableModules || undefined,
		} )
		.map( ( widget: { slug: string } ) => widget.slug );

	/**
	 * Tracks tiles that failed to load (threw), as opposed to tiles left out
	 * for having no data. When every attempted tile failed, the section
	 * is treated as an outage below rather than a genuinely empty section.
	 */
	let failureCount = 0;

	// A tile with no data (or a failed load) resolves to `null` and is filtered
	// out below.
	const tilePromises: Promise< KeyMetricsPDFTile | null >[] = [];

	for ( const slug of orderedSlugs ) {
		const pdfTile = keyMetricsPDFTiles[ slug ];
		const title = keyMetricsWidgets[ slug ]?.title;

		if ( ! pdfTile ) {
			continue;
		}

		tilePromises.push(
			( async () => {
				// The tile's `TileComponent` is a `lazyWithPreload` component so
				// the dashboard bundle stays free of `@react-pdf/renderer`.
				// Preload it here and hand its resolved default to the aggregate
				// component, which renders it directly (the react-pdf renderer
				// does not honour Suspense).
				try {
					const [ data, resolved ] = await Promise.all( [
						pdfTile.getTileData( { registry, dates, signal } ),
						typeof pdfTile.TileComponent.preload === 'function'
							? pdfTile.TileComponent.preload()
							: Promise.resolve( {
									default: pdfTile.TileComponent,
							  } ),
					] );

					// The tile's report has no data, so leave it out entirely.
					if ( data === null || data === undefined ) {
						return null;
					}

					return {
						slug,
						title,
						TileComponent: resolved.default as TileRenderComponent,
						data,
					};
				} catch {
					// A failed report drops just this tile, but is counted so a
					// section where every tile failed can surface as an error.
					failureCount += 1;
					return null;
				}
			} )()
		);
	}

	const loadedTiles = await Promise.all( tilePromises );

	if ( signal.aborted ) {
		return { data: null };
	}

	const tiles = loadedTiles.filter(
		( tile ): tile is KeyMetricsPDFTile => tile !== null
	);

	if ( tiles.length === 0 ) {
		// Every attempted tile failed to load, so surface the outage as an
		// export error instead of a silently empty section. Mirrors the
		// orchestrator, which errors only when every widget fails.
		if ( failureCount > 0 && failureCount === tilePromises.length ) {
			throw new Error( 'All Key Metrics PDF tiles failed to load.' );
		}

		// No configured tile has data, so omit the whole section from the report.
		return { data: null };
	}

	return { data: { tiles } };
}
