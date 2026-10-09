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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getTopChannelsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { createBreakdownReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import {
	createWaitForRegistry,
	freezeFetch,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { useFreshDataReport } from './useFreshDataReport';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

describe( 'useFreshDataReport', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const channelsReport = createBreakdownReport( [
		[ 'Direct', 12 ],
		[ 'Referral', 4 ],
	] );

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		jest.mocked( get ).mockClear();

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	} );

	it( 'should build the report options for the date range of the Recent activity tab, not for the date range of the dashboard', () => {
		freezeFetch( reportEndpoint );

		const { result } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		expect( result.current.reportOptions ).toEqual(
			getTopChannelsReportOptions( {
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} )
		);
	} );

	it( 'should request the report with a cache of five minutes', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: channelsReport,
			status: 200,
		} );

		const { waitForRegistry } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1 );
		expect( jest.mocked( get ).mock.calls[ 0 ][ 4 ] ).toStrictEqual( {
			cacheTTL: 300,
		} );
	} );

	it( 'should be loading, with no report and no error, while the request has not finished', async () => {
		freezeFetch( reportEndpoint );

		const { result } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( result.current ).toMatchObject( {
			report: undefined,
			loading: true,
			error: undefined,
		} );
	} );

	it( 'should return the report, and should not be loading, once the request succeeds', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: channelsReport,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			report: channelsReport,
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should return the error, and should not be loading, once the request fails', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			report: undefined,
			loading: false,
			error: errorResponse,
		} );
	} );

	it( 'should request the report again, with the same cache, when `retry` is called after the request fails', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( reportEndpoint, {
			body: channelsReport,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// `waitForRegistry` settles once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2 );
		expect( jest.mocked( get ).mock.calls[ 1 ][ 4 ] ).toStrictEqual( {
			cacheTTL: 300,
		} );
		expect( result.current ).toMatchObject( {
			report: channelsReport,
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should not request the report while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( reportEndpoint, {
			body: channelsReport,
			status: 200,
		} );

		const { result } = renderHook(
			() => useFreshDataReport( getTopChannelsReportOptions ),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.report ).toBeUndefined();
	} );
} );
