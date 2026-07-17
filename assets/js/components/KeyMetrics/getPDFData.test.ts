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
import { KEY_METRICS_WIDGETS } from './key-metrics-widgets';

jest.mock( './key-metrics-widgets', () => ( { KEY_METRICS_WIDGETS: {} } ) );

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The mock map holds arbitrary test entries.
const widgets = KEY_METRICS_WIDGETS as Record< string, any >;

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds a mock registry whose `getKeyMetrics` resolves to the given slugs.
 *
 * @since n.e.x.t
 *
 * @param slugs The user's configured key metric slugs.
 * @return A mock registry.
 */
function createRegistry( slugs: string[] ) {
	return {
		resolveSelect: jest.fn( () => ( {
			getKeyMetrics: jest.fn( () => Promise.resolve( slugs ) ),
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
	} );

	it( 'skips metrics without a pdfTile and returns the rest in configured order', async () => {
		const getTileDataA = jest.fn( () => Promise.resolve( { value: 'A' } ) );
		const getTileDataB = jest.fn( () => Promise.resolve( { value: 'B' } ) );

		widgets.metricA = {
			title: 'Metric A',
			pdfTile: { TileComponent: TileA, getTileData: getTileDataA },
		};
		// No `pdfTile`, so it is skipped.
		widgets.metricNoPDF = { title: 'No PDF' };
		widgets.metricB = {
			title: 'Metric B',
			pdfTile: { TileComponent: TileB, getTileData: getTileDataB },
		};

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

	it( 'captures a single tile failure as null data without failing the others', async () => {
		widgets.metricA = {
			title: 'Metric A',
			pdfTile: {
				TileComponent: TileA,
				getTileData: jest.fn( () =>
					Promise.reject( new Error( 'boom' ) )
				),
			},
		};
		widgets.metricB = {
			title: 'Metric B',
			pdfTile: {
				TileComponent: TileB,
				getTileData: jest.fn( () => Promise.resolve( { value: 'B' } ) ),
			},
		};

		const registry = createRegistry( [ 'metricA', 'metricB' ] );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.tiles ).toEqual( [
			{
				slug: 'metricA',
				title: 'Metric A',
				TileComponent: TileA,
				data: null,
			},
			{
				slug: 'metricB',
				title: 'Metric B',
				TileComponent: TileB,
				data: { value: 'B' },
			},
		] );
	} );

	it( 'throws only when every tile fails', async () => {
		widgets.metricA = {
			title: 'Metric A',
			pdfTile: {
				TileComponent: TileA,
				getTileData: jest.fn( () =>
					Promise.reject( new Error( 'a' ) )
				),
			},
		};
		widgets.metricB = {
			title: 'Metric B',
			pdfTile: {
				TileComponent: TileB,
				getTileData: jest.fn( () =>
					Promise.reject( new Error( 'b' ) )
				),
			},
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
		widgets.metricA = {
			title: 'Metric A',
			pdfTile: { TileComponent: TileA, getTileData },
		};

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

	it( 'preloads a lazy TileComponent and returns its resolved default', async () => {
		function ResolvedTile() {
			return null;
		}
		const preload = jest.fn( () =>
			Promise.resolve( { default: ResolvedTile } )
		);
		const LazyTile = Object.assign( () => null, { preload } );

		widgets.metricA = {
			title: 'Metric A',
			pdfTile: {
				TileComponent: LazyTile,
				getTileData: jest.fn( () => Promise.resolve( { value: 'A' } ) ),
			},
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
