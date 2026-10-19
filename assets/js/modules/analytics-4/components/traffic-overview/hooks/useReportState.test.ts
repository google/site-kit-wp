/**
 * Traffic Overview `useReportState` hook tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { useReportState } from './useReportState';

describe( 'useReportState', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
	} );

	it( 'should request no report, and should not be loading, without report options', async () => {
		const { result } = renderHook(
			() => useReportState( MODULES_ANALYTICS_4 ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( result.current ).toEqual( {
			report: undefined,
			loading: false,
			error: undefined,
		} );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should be loading while the report request is in progress', async () => {
		freezeFetch( reportEndpoint );
		const reportOptions = {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			metrics: [ { name: 'totalUsers' } ],
		};

		const { result, waitForRegistry } = renderHook(
			() => useReportState( MODULES_ANALYTICS_4, reportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			report: undefined,
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should return the error, and should stop loading, when the report request fails', async () => {
		fetchMock.get( reportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'The report is unavailable.',
				data: { status: 500 },
			},
			status: 500,
		} );
		const reportOptions = {
			startDate: '2026-09-17',
			endDate: '2026-10-08',
			metrics: [ { name: 'totalUsers' } ],
		};

		const { result, waitForRegistry } = renderHook(
			() => useReportState( MODULES_ANALYTICS_4, reportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			report: undefined,
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'The report is unavailable.',
				data: { status: 500 },
			},
		} );
		expect( console ).toHaveErrored();
	} );
} );
