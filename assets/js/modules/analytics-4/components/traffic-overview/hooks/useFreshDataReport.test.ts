/**
 * Traffic Overview `useFreshDataReport` hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
	waitFor,
} from '@tests/js/test-utils';
import { freezeFetch, waitForDefaultTimeouts } from '@tests/js/utils';
import { useFreshDataReport } from './useFreshDataReport';

// The fetch options reach `get()` and never the request that `fetchMock`
// receives, so the tests read them from a spy on `get()`.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

describe( 'useFreshDataReport', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const reportArgs = {
		startDate: '2025-02-04',
		endDate: '2025-02-05',
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ 'sessionDefaultChannelGroup' ],
	};

	const report = {
		rows: [
			{
				dimensionValues: [ { value: 'Direct' } ],
				metricValues: [ { value: '82' } ],
			},
		],
	};

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		jest.mocked( get ).mockClear();
	} );

	it( 'should request the report once, with a five-minute cache', async () => {
		fetchMock.getOnce( reportEndpoint, { body: report, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => useFreshDataReport( reportArgs ),
			{ registry }
		);

		await waitForRegistry();

		expect( get ).toHaveBeenCalledTimes( 1 );
		expect( get ).toHaveBeenCalledWith(
			'modules',
			'analytics-4',
			'report',
			expect.objectContaining( {
				startDate: '2025-02-04',
				endDate: '2025-02-05',
			} ),
			{ cacheTTL: 300 }
		);
	} );

	it( 'should return `loading` as `true` and no report while the request runs', async () => {
		freezeFetch( reportEndpoint );

		const { result } = renderHook( () => useFreshDataReport( reportArgs ), {
			registry,
		} );

		await waitForDefaultTimeouts();

		expect( result.current.loading ).toBe( true );
		expect( result.current.report ).toBeUndefined();
	} );

	it( 'should return the report and `loading` as `false` once the request finishes', async () => {
		fetchMock.getOnce( reportEndpoint, { body: report, status: 200 } );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( reportArgs ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loading ).toBe( false );
		expect( result.current.report ).toEqual( report );
		expect( result.current.error ).toBeUndefined();
	} );

	it( 'should return the error and `loading` as `false` when the request fails', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( reportArgs ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current.loading ).toBe( false );
		expect( result.current.error ).toEqual( errorResponse );
	} );

	it( 'should request the report again, and return it, when `retry` is called after the request fails', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( reportArgs ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		fetchMock.getOnce( reportEndpoint, { body: report, status: 200 } );

		act( () => {
			result.current.retry();
		} );

		await waitFor( () =>
			expect( result.current.report ).toEqual( report )
		);

		expect( fetchMock ).toHaveFetchedTimes( 2, reportEndpoint );
		expect( result.current.error ).toBeUndefined();
	} );

	it( 'should not request the report, and return `loading` as `true`, while the widget is out of view', async () => {
		const { result } = renderHook( () => useFreshDataReport( reportArgs ), {
			registry,
			inView: false,
		} );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.loading ).toBe( true );
		expect( result.current.report ).toBeUndefined();
	} );
} );
