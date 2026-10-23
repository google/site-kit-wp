/**
 * Traffic Overview `useRecentTrafficBreakdownColumn` hook tests.
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
import { getTopChannelsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	createBreakdownReport,
	forDimensions,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import { createWaitForRegistry, waitForDefaultTimeouts } from '@tests/js/utils';
import { useRecentTrafficBreakdownColumn } from './useRecentTrafficBreakdownColumn';

describe( 'useRecentTrafficBreakdownColumn', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const channelsRequest = forDimensions( 'sessionDefaultChannelGroup' );

	// The site had 157 visits, and 63 of them came from channels the report
	// leaves out.
	const channelsReport = createBreakdownReport(
		[
			[ 'Direct', 82 ],
			[ 'Referral', 12 ],
		],
		157
	);

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( "should return the column's rows, each with its share of the report's total", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, channelsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.7%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( 'should be loading, with no rows, and should not request a report, while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( reportEndpoint, {
			body: channelsReport,
			status: 200,
		} );

		const { result } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: true,
			error: undefined,
		} );
	} );

	it( "should return the error of the column's report, with no rows, when its request fails", async () => {
		fetchMock.get( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toMatchObject( {
			rows: [],
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
	} );

	it( "should request the column's report again, and return its rows, when `retry` is called after that request fails", async () => {
		fetchMock.getOnce( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, channelsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.7%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );
} );
