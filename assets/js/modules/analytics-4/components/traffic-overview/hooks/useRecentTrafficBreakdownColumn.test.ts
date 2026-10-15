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
import {
	getTopChannelsReportOptions,
	getTopPostsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getPlainPermalinkPost } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPlainPermalinkPost';
import {
	createBreakdownReport,
	createSiteTotalsReport,
	forDimensions,
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
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useRecentTrafficBreakdownColumn } from './useRecentTrafficBreakdownColumn';

describe( 'useRecentTrafficBreakdownColumn', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const channelsRequest = forDimensions( 'sessionDefaultChannelGroup' );
	const pagesRequest = forDimensions( 'pagePath' );
	const siteTotalsRequest = forDimensions();

	/**
	 * Builds the options of the report of views for each page, for a site with
	 * a permalink structure.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} dateRange The date range of the Recent activity tab.
	 * @return {Object} The report options.
	 */
	function getPagesReportOptions( dateRange: FreshDataDateRange ) {
		return getTopPostsReportOptions( dateRange, {
			usingPlainPermalinks: false,
		} );
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

	it( "should return the column's rows, each with its share of the site's visits", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.get( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
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
				{ label: 'Referral', value: '12', secondaryValue: '(7.7%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( "should return the rows of a column that counts views, each with its share of the site's views", async () => {
		fetchMock.get( pagesRequest, {
			body: createBreakdownReport( [
				[ '/ice-cream/', 82 ],
				[ '/hydration/', 12 ],
			] ),
			status: 200,
		} );
		fetchMock.get( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
			status: 200,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useRecentTrafficBreakdownColumn( getPagesReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{ label: '/ice-cream/', value: '82', secondaryValue: '(30.6%)' },
			{ label: '/hydration/', value: '12', secondaryValue: '(4.5%)' },
		] );
	} );

	it( 'should add up the rows that `getRowLabel` returns the same label for, and leave out the rows it returns no label for', async () => {
		fetchMock.get( pagesRequest, {
			body: createBreakdownReport( [
				[ '/?p=12', 82 ],
				[ '/', 40 ],
				[ '/?p=12&utm_source=newsletter', 12 ],
			] ),
			status: 200,
		} );
		fetchMock.get( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
			status: 200,
		} );

		function getRowLabel( pagePathPlusQueryString: string ) {
			return getPlainPermalinkPost(
				pagePathPlusQueryString,
				'http://example.com'
			)?.path;
		}

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentTrafficBreakdownColumn(
					getPagesReportOptions,
					getRowLabel
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.rows ).toEqual( [
			{ label: '/?p=12', value: '94', secondaryValue: '(35.1%)' },
		] );
	} );

	it( "should be loading while the report of the site's totals loads, after the column's report has loaded", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		freezeFetch( siteTotalsRequest );

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

	it( "should return the error of the report of the site's totals when only that request fails", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.get( siteTotalsRequest, {
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

	it( "should request only the report of the site's totals again when `retry` is called after that request fails", async () => {
		fetchMock.get( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.getOnce( siteTotalsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
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

		expect( fetchMock ).toHaveFetchedTimes( 1, channelsRequest );
		expect( fetchMock ).toHaveFetchedTimes( 2, siteTotalsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.7%)' },
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
		fetchMock.get( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
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
		expect( fetchMock ).toHaveFetchedTimes( 1, siteTotalsRequest );
		expect( result.current ).toMatchObject( {
			rows: [
				{ label: 'Direct', value: '82', secondaryValue: '(52.2%)' },
				{ label: 'Referral', value: '12', secondaryValue: '(7.7%)' },
			],
			loading: false,
			error: undefined,
		} );
	} );

	it( "should return the error of the column's report when both requests fail", async () => {
		fetchMock.getOnce( channelsRequest, {
			body: {
				code: 'channels_error',
				message: 'Channels error',
				data: { status: 500 },
			},
			status: 500,
		} );
		fetchMock.getOnce( siteTotalsRequest, {
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
		expect( result.current.error ).toEqual( {
			code: 'channels_error',
			message: 'Channels error',
			data: { status: 500 },
		} );
	} );

	it( 'should request both reports again when `retry` is called after both requests fail', async () => {
		fetchMock.getOnce( channelsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( channelsRequest, {
			body: channelsReport,
			status: 200,
		} );
		fetchMock.getOnce( siteTotalsRequest, {
			body: errorResponse,
			status: 500,
		} );
		fetchMock.getOnce( siteTotalsRequest, {
			body: createSiteTotalsReport( { visits: 157, views: 268 } ),
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
		expect( fetchMock ).toHaveFetchedTimes( 2, siteTotalsRequest );
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
