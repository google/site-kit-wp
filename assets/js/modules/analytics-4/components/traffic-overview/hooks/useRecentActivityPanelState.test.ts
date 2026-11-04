/**
 * Traffic Overview `useRecentActivityPanelState` hook tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import {
	getSearchPerformanceReportOptions,
	getSiteVisitorsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	INSUFFICIENT_PERMISSIONS_ERROR,
	INTERNAL_SERVER_ERROR,
	RATE_LIMIT_ERROR,
	provideFreshMetricsReports,
	provideSiteVisitorsReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { useRecentActivityPanelState } from './useRecentActivityPanelState';

describe( 'useRecentActivityPanelState', () => {
	let registry: WPDataRegistry;
	let dateNowSpy: jest.SpyInstance;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const searchAnalyticsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
	);

	beforeEach( () => {
		// The clock starts at 09:30 UTC on February 5, so the last 24 hours
		// start at 10:00 UTC on February 4 in every run.
		const realDateNow = Date.now;
		const offset = Date.parse( '2025-02-05T09:30:00Z' ) - realDateNow();
		dateNowSpy = jest
			.spyOn( Date, 'now' )
			.mockImplementation( () => realDateNow() + offset );

		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	} );

	afterEach( () => {
		dateNowSpy.mockRestore();
	} );

	it( 'should return `access-error` for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'access-error' );
	} );

	it( 'should return `access-error` when the site visitors report fails with the reason `insufficientPermissions`', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: INSUFFICIENT_PERMISSIONS_ERROR,
			status: 403,
		} );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toBe( 'access-error' );
	} );

	it( 'should return `access-error` when the site visitors report fails with the reason `forbidden`', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: {
				code: 403,
				message: 'Forbidden',
				data: { status: 403, reason: 'forbidden' },
			},
			status: 403,
		} );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toBe( 'access-error' );
	} );

	it( 'should return `zero-data` when Analytics counts no visitors and Search Console counts no impressions', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		// Search Console returns no rows for a window with no impressions.
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'zero-data' );
	} );

	it( 'should return `zero-data` when Analytics counts no visitors for a view-only user who cannot view Search Console', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: false,
		} );
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'zero-data' );
	} );

	it( 'should return `zero-data` when Search Console counts impressions only before the last 24 hours', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					// The hour before the last 24 hours start.
					keys: [ '2025-02-04T09:00:00Z' ],
					clicks: 72,
					impressions: 8000,
				},
			],
			{
				options: getSearchPerformanceReportOptions(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			}
		);

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'zero-data' );
	} );

	it( 'should return `default` when Analytics counts no visitors and Search Console counts impressions', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					keys: [ '2025-02-04T10:00:00Z' ],
					clicks: 72,
					impressions: 8000,
				},
			],
			{
				options: getSearchPerformanceReportOptions(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			}
		);

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when Analytics counts visitors and Search Console counts no impressions', async () => {
		provideSiteVisitorsReport( registry, 157 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when the site visitors report counts no visitors and "Total visitors" counts visitors in the last 24 hours', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 1 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` while Analytics is gathering data', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` while it is not known whether Analytics is gathering data', async () => {
		// This registry has no gathering state, and the request that would give
		// it never finishes.
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );
		freezeFetch( reportEndpoint );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( reportEndpoint );
		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` while the site visitors report loads', async () => {
		freezeFetch( reportEndpoint );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` while the "Total visitors" report loads', async () => {
		freezeFetch( reportEndpoint );
		provideSiteVisitorsReport( registry, 0 );
		// With no figures, only the report that gives the time zone goes in.
		provideFreshMetricsReports( registry, {} );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( reportEndpoint );
		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` while the Search Console report loads', async () => {
		freezeFetch( searchAnalyticsEndpoint );
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when the site visitors report fails with an internal server error', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: INTERNAL_SERVER_ERROR,
			status: 500,
		} );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when the site visitors report fails with a rate limit error', async () => {
		fetchMock.getOnce( reportEndpoint, {
			body: RATE_LIMIT_ERROR,
			status: 429,
		} );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when Analytics counts no visitors and the Search Console report fails', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		fetchMock.getOnce( searchAnalyticsEndpoint, {
			body: INTERNAL_SERVER_ERROR,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when the site visitors report counts no visitors and also has an internal server error', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		// A report that loaded once stays in the store when a later request
		// for it fails.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( INTERNAL_SERVER_ERROR, 'getReport', [
				getSiteVisitorsReportOptions( {
					startDate: '2025-02-03',
					endDate: '2025-02-05',
				} ),
			] );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should return `default` when the Search Console report counts no impressions and also has an internal server error', async () => {
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: getSearchPerformanceReportOptions(
				Date.parse( '2025-02-04T10:00:00Z' )
			),
		} );
		// A report that loaded once stays in the store when a later request
		// for it fails.
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.setErrorForSelector( INTERNAL_SERVER_ERROR, 'getReport', [
				getSearchPerformanceReportOptions(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			] );

		const { result, waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toBe( 'default' );
	} );

	it( 'should not request a report while Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
		fetchMock.get( searchAnalyticsEndpoint, { body: [], status: 200 } );

		renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchAnalyticsEndpoint );
	} );

	it( 'should not request a report for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		} );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
		fetchMock.get( searchAnalyticsEndpoint, { body: [], status: 200 } );

		renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchAnalyticsEndpoint );
	} );

	it( 'should not request the Search Console report for a view-only user who cannot view Search Console', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: false,
		} );
		provideSiteVisitorsReport( registry, 0 );
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		fetchMock.get( searchAnalyticsEndpoint, { body: [], status: 200 } );

		const { waitForRegistry } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( searchAnalyticsEndpoint );
	} );

	it( 'should return `default`, and should not request a report, while the Traffic Overview widget is out of view', async () => {
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
		fetchMock.get( searchAnalyticsEndpoint, { body: [], status: 200 } );

		const { result } = renderHook(
			() =>
				useRecentActivityPanelState(
					Date.parse( '2025-02-04T10:00:00Z' )
				),
			{ registry, inView: false }
		);

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchAnalyticsEndpoint );
		expect( result.current ).toBe( 'default' );
	} );
} );
