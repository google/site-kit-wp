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
	createSiteVisitorsReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
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
import { useRecentTrafficBreakdownColumn } from './useRecentTrafficBreakdownColumn';

describe( 'useRecentTrafficBreakdownColumn', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Checks whether a request is for the channels report, which groups its
	 * visitors by channel.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} url The URL of the request.
	 * @return {boolean} `true` when the URL is a request for the channels report.
	 */
	function channelsRequest( url: string ) {
		return (
			reportEndpoint.test( url ) &&
			url.includes( 'sessionDefaultChannelGroup' )
		);
	}

	/**
	 * Checks whether a request is for the report of the site's visitors, which
	 * has no dimension.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} url The URL of the request.
	 * @return {boolean} `true` when the URL is a request for the report of the site's visitors.
	 */
	function siteVisitorsRequest( url: string ) {
		return reportEndpoint.test( url ) && ! url.includes( 'dimensions' );
	}

	const channelsReport = createBreakdownReport( [
		[ 'Direct', 82 ],
		[ 'Referral', 12 ],
	] );

	const errorResponse = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( "should return the column's rows, each with its share of the site's visitors", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.get( siteVisitorsRequest, {
			body: createSiteVisitorsReport( 157 ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.6%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( "should be loading while the report of the site's visitors loads, after the column's report has loaded", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		freezeFetch( siteVisitorsRequest );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, channelsRequest );
		expect( result.current.report ).toEqual( {
			rows: [
				{
					dimensionValues: [ { value: 'Direct' } ],
					metricValues: [ { value: '82' } ],
				},
				{
					dimensionValues: [ { value: 'Referral' } ],
					metricValues: [ { value: '12' } ],
				},
			],
		} );
		expect( result.current.loading ).toBe( true );
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

	it( "should return the error of the report of the site's visitors when only that request fails", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.get( siteVisitorsRequest, {
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
			loading: false,
			error: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
		} );
	} );

	it( "should request only the report of the site's visitors again when `retry` is called after that request fails", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.getOnce( siteVisitorsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( siteVisitorsRequest, {
			body: createSiteVisitorsReport( 157 ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		// `retry` invalidates the column's report too, but the `getReport`
		// resolver sends no request for a report the store already has.
		expect( fetchMock ).toHaveFetchedTimes( 1, channelsRequest );
		expect( fetchMock ).toHaveFetchedTimes( 2, siteVisitorsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.6%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( "should request only the column's report again when `retry` is called after that request fails", async () => {
		fetchMock.getOnce( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.get( siteVisitorsRequest, {
			body: createSiteVisitorsReport( 157 ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, channelsRequest );
		expect( fetchMock ).toHaveFetchedTimes( 1, siteVisitorsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.6%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( "should return the error of the column's report, and should request both reports again on `retry`, when both requests fail", async () => {
		fetchMock.getOnce( channelsRequest, {
			body: {
				code: 'channels_error',
				message: 'Channels error',
				data: { status: 500 },
			},
			status: 500,
		} );
		fetchMock.getOnce( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.getOnce( siteVisitorsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( siteVisitorsRequest, {
			body: createSiteVisitorsReport( 157 ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn( getTopChannelsReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current.error ).toEqual( {
			code: 'channels_error',
			message: 'Channels error',
			data: { status: 500 },
		} );

		// `waitForRegistry` resolves only once, so a new one waits for the retry.
		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			result.current.retry();
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 2, channelsRequest );
		expect( fetchMock ).toHaveFetchedTimes( 2, siteVisitorsRequest );
		expect( result.current ).toMatchObject( {
			loading: false,
			error: undefined,
		} );
	} );
} );
