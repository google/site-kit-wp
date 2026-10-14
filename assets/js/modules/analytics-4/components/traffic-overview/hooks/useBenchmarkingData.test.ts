/**
 * Traffic Overview `useBenchmarkingData` hook tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { decodedBenchmarkingResponse } from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch } from '@tests/js/utils';
import { useBenchmarkingData } from './useBenchmarkingData';

describe( 'useBenchmarkingData', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// With this reference date, `last-28-days` runs from `2025-01-09` to
		// `2025-02-05`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	} );

	it( 'should request the selected date range and return the decoded response', async () => {
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			),
			{ body: benchmarkingData, status: 200 }
		);

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingData(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			),
			{ query: { startDate: '2025-01-09', endDate: '2025-02-05' } }
		);
		expect( result.current ).toEqual( {
			startDate: '2025-01-09',
			endDate: '2025-02-05',
			response: decodedBenchmarkingResponse,
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should return `true` for `loading` when the request is in progress', async () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			)
		);

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingData(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loading ).toBe( true );
		expect( result.current.response ).toBeUndefined();
	} );

	it( 'should return the error the request fails with', async () => {
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			),
			{
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			}
		);

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingData(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current.error ).toEqual( {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		} );
		expect( result.current.response ).toBeUndefined();
		expect( result.current.loading ).toBe( false );
	} );
} );
