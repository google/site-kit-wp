/**
 * Key Metrics tile data loader factory tests.
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
import createKeyMetricTileDataLoader from './create-key-metric-tile-data-loader';

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds a mock registry whose `dispatch( store ).fetchGetReport` is the given
 * mock, so the loader's report fetches can be inspected.
 *
 * @since 1.184.0
 *
 * @param fetchGetReport The `fetchGetReport` mock.
 * @return A mock registry and the `dispatch` spy.
 */
function createRegistry( fetchGetReport: jest.Mock ) {
	const dispatch = jest.fn( () => ( { fetchGetReport } ) );
	return {
		registry: { dispatch } as unknown as GetPDFDataParams[ 'registry' ],
		dispatch,
	};
}

describe( 'createKeyMetricTileDataLoader', () => {
	it( 'dispatches fetchGetReport per report with the signal and passes the responses to extract in order', async () => {
		const fetchGetReport = jest
			.fn()
			.mockResolvedValueOnce( { response: 'REPORT_A' } )
			.mockResolvedValueOnce( { response: 'REPORT_B' } );
		const { registry, dispatch } = createRegistry( fetchGetReport );
		const extract = jest.fn( ( reports ) => ( { reports } ) );
		const buildReports = jest.fn( ( dates ) => [
			{ moduleStore: 'test/store-a', options: { id: 'a', ...dates } },
			{ moduleStore: 'test/store-b', options: { id: 'b' } },
		] );
		const { signal } = new AbortController();

		const getTileData = createKeyMetricTileDataLoader(
			buildReports,
			extract
		);
		const result = await getTileData( { registry, dates: DATES, signal } );

		expect( buildReports ).toHaveBeenCalledWith( DATES, registry );
		expect( dispatch ).toHaveBeenCalledWith( 'test/store-a' );
		expect( dispatch ).toHaveBeenCalledWith( 'test/store-b' );
		expect( fetchGetReport ).toHaveBeenCalledWith(
			{ id: 'a', ...DATES },
			{ signal }
		);
		expect( fetchGetReport ).toHaveBeenCalledWith(
			{ id: 'b' },
			{ signal }
		);
		// Extract receives the responses (not the `{ response }` wrappers), in
		// the order the reports were built.
		expect( extract ).toHaveBeenCalledWith( [ 'REPORT_A', 'REPORT_B' ] );
		expect( result ).toEqual( { reports: [ 'REPORT_A', 'REPORT_B' ] } );
	} );

	it( 'fetches every report in parallel', async () => {
		const started: string[] = [];
		const releases: Array< () => void > = [];
		const fetchGetReport = jest.fn( ( options ) => {
			started.push( options.id );
			return new Promise( ( resolve ) =>
				releases.push( () => resolve( { response: options.id } ) )
			);
		} );
		const { registry } = createRegistry( fetchGetReport );
		const getTileData = createKeyMetricTileDataLoader(
			() => [
				{ moduleStore: 'test/store-a', options: { id: 'a' } },
				{ moduleStore: 'test/store-b', options: { id: 'b' } },
			],
			( reports ) => reports
		);

		const run = getTileData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// Let the microtasks flush so both fetches start before either resolves.
		await Promise.resolve();

		expect( started ).toEqual( [ 'a', 'b' ] );

		releases.forEach( ( release ) => release() );
		await run;
	} );

	it( 'returns null without fetching when the signal is already aborted', async () => {
		const fetchGetReport = jest.fn();
		const { registry } = createRegistry( fetchGetReport );
		const controller = new AbortController();
		controller.abort();

		const getTileData = createKeyMetricTileDataLoader(
			() => [ { moduleStore: 'test/store', options: {} } ],
			jest.fn()
		);
		const result = await getTileData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toBeNull();
		expect( fetchGetReport ).not.toHaveBeenCalled();
	} );

	it( 'returns null without calling extract when the signal aborts while fetching', async () => {
		const controller = new AbortController();
		const fetchGetReport = jest.fn( () => {
			controller.abort();
			return Promise.resolve( { response: 'REPORT' } );
		} );
		const { registry } = createRegistry( fetchGetReport );
		const extract = jest.fn();

		const getTileData = createKeyMetricTileDataLoader(
			() => [ { moduleStore: 'test/store', options: {} } ],
			extract
		);
		const result = await getTileData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toBeNull();
		expect( extract ).not.toHaveBeenCalled();
	} );

	it( 'throws without calling extract when a report fails', async () => {
		const error = { message: 'report failed' };
		const fetchGetReport = jest
			.fn()
			.mockResolvedValueOnce( { response: 'REPORT_A' } )
			.mockResolvedValueOnce( { error } );
		const { registry } = createRegistry( fetchGetReport );
		const extract = jest.fn();

		const getTileData = createKeyMetricTileDataLoader(
			() => [
				{ moduleStore: 'test/store-a', options: {} },
				{ moduleStore: 'test/store-b', options: {} },
			],
			extract
		);

		await expect(
			getTileData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} )
		).rejects.toBe( error );
		expect( extract ).not.toHaveBeenCalled();
	} );
} );
