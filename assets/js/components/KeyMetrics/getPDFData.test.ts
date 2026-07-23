/**
 * Key Metrics aggregate getPDFData tests.
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
import getPDFData from './getPDFData';
import { KEY_METRICS_PDF_TILES } from './key-metrics-pdf-tiles';
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

jest.mock( './key-metrics-widgets', () => ( { KEY_METRICS_WIDGETS: {} } ) );
jest.mock( './key-metrics-pdf-tiles', () => ( { KEY_METRICS_PDF_TILES: {} } ) );

const widgets = KEY_METRICS_WIDGETS as Record< string, unknown >;
const tiles = KEY_METRICS_PDF_TILES as Record< string, unknown >;

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds a mock registry whose Key Metrics area returns the given slugs, in
 * order. The loader reads the area's active widgets (the dashboard's render
 * order), so this is what drives the exported tile order. `widgetModules` mirrors
 * the real `getWidgets` module filter: a slug is dropped when the caller passes a
 * `modules` scope that does not include every module the widget requires.
 *
 * @since 1.184.0
 *
 * @param slugs           The area's active widget slugs, in dashboard order.
 * @param widgetModules   Map of slug to the modules that widget requires.
 * @param keyMetricsSlugs The raw key metric selection order, when it must differ from the area order. Defaults to `slugs`.
 * @return A mock registry.
 */
function createRegistry(
	slugs: string[],
	widgetModules: Record< string, string[] > = {},
	keyMetricsSlugs: string[] = slugs
) {
	return {
		resolveSelect: jest.fn( () => ( {
			getKeyMetrics: jest.fn( () => Promise.resolve( keyMetricsSlugs ) ),
		} ) ),
		select: jest.fn( () => ( {
			getWidgets: jest.fn(
				(
					_areaSlug: string,
					{ modules }: { modules?: string[] } = {}
				) =>
					slugs
						.filter( ( slug ) => {
							const required = widgetModules[ slug ];
							if ( ! required || ! modules ) {
								return true;
							}
							return required.every( ( module ) =>
								modules.includes( module )
							);
						} )
						.map( ( slug ) => ( { slug } ) )
			),
		} ) ),
	} as unknown as GetPDFDataParams[ 'registry' ];
}

function TileA() {
	return null;
}
function TileB() {
	return null;
}

describe( 'Key Metrics getPDFData', () => {
	beforeEach( () => {
		Object.keys( widgets ).forEach( ( key ) => delete widgets[ key ] );
		Object.keys( tiles ).forEach( ( key ) => delete tiles[ key ] );
	} );

	it( 'skips widgets without a pdfTile and returns the rest in the dashboard order', async () => {
		const getTileDataA = jest.fn( () => Promise.resolve( { value: 'A' } ) );
		const getTileDataB = jest.fn( () => Promise.resolve( { value: 'B' } ) );

		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = { TileComponent: TileA, getTileData: getTileDataA };
		// No `pdfTile`, so it is skipped.
		widgets.metricNoPDF = { title: 'No PDF' };
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = { TileComponent: TileB, getTileData: getTileDataB };

		const registry = createRegistry( [
			'metricA',
			'metricNoPDF',
			'metricB',
		] );
		const { signal } = new AbortController();

		const result = await getPDFData( { registry, dates: DATES, signal } );

		expect( getTileDataA ).toHaveBeenCalledWith( {
			registry,
			dates: DATES,
			signal,
		} );
		expect( result.data?.tiles ).toEqual( [
			{
				slug: 'metricA',
				title: 'Metric A',
				TileComponent: TileA,
				data: { value: 'A' },
			},
			{
				slug: 'metricB',
				title: 'Metric B',
				TileComponent: TileB,
				data: { value: 'B' },
			},
		] );
	} );

	it( 'orders tiles by the area widgets, not by the raw key metric selection', async () => {
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			getTileData: jest.fn( () => Promise.resolve( { value: 'A' } ) ),
		};
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = {
			TileComponent: TileB,
			getTileData: jest.fn( () => Promise.resolve( { value: 'B' } ) ),
		};

		// The area returns B before A (the dashboard's render order) while the raw
		// key metric selection is the opposite order, so the assertion pins the
		// exported order to the area, not to the selection.
		const registry = createRegistry( [ 'metricB', 'metricA' ], {}, [
			'metricA',
			'metricB',
		] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.tiles.map( ( tile ) => tile.slug ) ).toEqual( [
			'metricB',
			'metricA',
		] );
	} );

	it( 'excludes a failed tile and keeps the tiles that loaded', async () => {
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			getTileData: jest.fn( () => Promise.reject( new Error( 'boom' ) ) ),
		};
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = {
			TileComponent: TileB,
			getTileData: jest.fn( () => Promise.resolve( { value: 'B' } ) ),
		};

		const registry = createRegistry( [ 'metricA', 'metricB' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.tiles ).toEqual( [
			{
				slug: 'metricB',
				title: 'Metric B',
				TileComponent: TileB,
				data: { value: 'B' },
			},
		] );
	} );

	it( 'excludes a tile whose report returns no data', async () => {
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			// A `null` result means the tile's report has no data.
			getTileData: jest.fn( () => Promise.resolve( null ) ),
		};
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = {
			TileComponent: TileB,
			getTileData: jest.fn( () => Promise.resolve( { value: 'B' } ) ),
		};

		const registry = createRegistry( [ 'metricA', 'metricB' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.tiles ).toEqual( [
			{
				slug: 'metricB',
				title: 'Metric B',
				TileComponent: TileB,
				data: { value: 'B' },
			},
		] );
	} );

	it( 'omits the section without throwing when one tile fails and the rest have no data', async () => {
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			getTileData: jest.fn( () => Promise.reject( new Error( 'a' ) ) ),
		};
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = {
			TileComponent: TileB,
			// No data for this tile, so the failure is not the whole story.
			getTileData: jest.fn( () => Promise.resolve( null ) ),
		};

		const registry = createRegistry( [ 'metricA', 'metricB' ] );

		// Not every attempted tile failed (one merely had no data), so this is a
		// genuinely empty section rather than an outage.
		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result ).toEqual( { data: null } );
	} );

	it( 'throws when every attempted tile fails to load, so an outage is not hidden', async () => {
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			getTileData: jest.fn( () => Promise.reject( new Error( 'a' ) ) ),
		};
		widgets.metricB = { title: 'Metric B' };
		tiles.metricB = {
			TileComponent: TileB,
			getTileData: jest.fn( () => Promise.reject( new Error( 'b' ) ) ),
		};

		const registry = createRegistry( [ 'metricA', 'metricB' ] );

		await expect(
			getPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} )
		).rejects.toThrow( 'All Key Metrics PDF tiles failed to load.' );
	} );

	it( 'drops tiles for modules the user cannot view', async () => {
		const getTileDataAdSense = jest.fn( () =>
			Promise.resolve( { value: 'A' } )
		);
		const getTileDataAnalytics = jest.fn( () =>
			Promise.resolve( { value: 'B' } )
		);

		widgets.metricAdSense = { title: 'AdSense metric' };
		tiles.metricAdSense = {
			TileComponent: TileA,
			getTileData: getTileDataAdSense,
		};
		widgets.metricAnalytics = { title: 'Analytics metric' };
		tiles.metricAnalytics = {
			TileComponent: TileB,
			getTileData: getTileDataAnalytics,
		};

		const registry = createRegistry(
			[ 'metricAdSense', 'metricAnalytics' ],
			{
				metricAdSense: [ 'adsense' ],
				metricAnalytics: [ 'analytics-4' ],
			}
		);

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			// AdSense is not shared, so its tile is neither loaded nor exported.
			viewableModules: [ 'analytics-4' ],
		} );

		expect( getTileDataAdSense ).not.toHaveBeenCalled();
		expect( result.data?.tiles.map( ( tile ) => tile.slug ) ).toEqual( [
			'metricAnalytics',
		] );
	} );

	it( 'returns null data when no configured metric has a pdfTile, so the section is omitted', async () => {
		// No `pdfTile`, so no tiles are composed.
		widgets.metricNoPDF = { title: 'No PDF' };

		const registry = createRegistry( [ 'metricNoPDF' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result ).toEqual( { data: null } );
	} );

	it( 'returns null data without loading tiles when the signal is already aborted', async () => {
		const getTileData = jest.fn();
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = { TileComponent: TileA, getTileData };

		const registry = createRegistry( [ 'metricA' ] );
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( getTileData ).not.toHaveBeenCalled();
	} );

	it( 'returns null data without loading tiles when aborted while resolving the key metrics', async () => {
		const controller = new AbortController();
		const getTileData = jest.fn();
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = { TileComponent: TileA, getTileData };

		// Abort mid-flight: the selection resolves, but the export is canceled
		// before the area widgets are read.
		const registry = {
			resolveSelect: jest.fn( () => ( {
				getKeyMetrics: jest.fn( () => {
					controller.abort();
					return Promise.resolve( [ 'metricA' ] );
				} ),
			} ) ),
			select: jest.fn( () => ( {
				getWidgets: jest.fn( () => [ { slug: 'metricA' } ] ),
			} ) ),
		} as unknown as GetPDFDataParams[ 'registry' ];

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( getTileData ).not.toHaveBeenCalled();
	} );

	it( 'returns null data when aborted after the tiles have loaded', async () => {
		const controller = new AbortController();
		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: TileA,
			// The tile loads, but the export is canceled before it is composed.
			getTileData: jest.fn( () => {
				controller.abort();
				return Promise.resolve( { value: 'A' } );
			} ),
		};

		const registry = createRegistry( [ 'metricA' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
	} );

	it( 'preloads a lazy TileComponent and returns its resolved default', async () => {
		function ResolvedTile() {
			return null;
		}
		const preload = jest.fn( () =>
			Promise.resolve( { default: ResolvedTile } )
		);
		const LazyTile = Object.assign( () => null, { preload } );

		widgets.metricA = { title: 'Metric A' };
		tiles.metricA = {
			TileComponent: LazyTile,
			getTileData: jest.fn( () => Promise.resolve( { value: 'A' } ) ),
		};

		const registry = createRegistry( [ 'metricA' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( preload ).toHaveBeenCalledTimes( 1 );
		expect( result.data?.tiles[ 0 ].TileComponent ).toBe( ResolvedTile );
	} );
} );
