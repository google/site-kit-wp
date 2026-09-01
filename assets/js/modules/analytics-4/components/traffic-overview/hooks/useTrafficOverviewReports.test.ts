/**
 * Traffic Overview `useTrafficOverviewReports` hook tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	allowAnalyticsAccess,
	denyAnalyticsAccess,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, provideModules, provideSiteInfo } from '@tests/js/utils';
import { useTrafficOverviewReports } from './useTrafficOverviewReports';

describe( 'useTrafficOverviewReports', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const byTotalUsersDescending = [
		{ metric: { metricName: 'totalUsers' }, desc: true },
	];

	/**
	 * Builds the five argument sets the hook passes to `getReport`, in the order
	 * totals, graph, channels, locations, and devices.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [url] Optional. The entity URL to add to every argument set.
	 * @return {Object[]} The five expected argument sets.
	 */
	function getExpectedArgs( url?: string ): ReportOptions[] {
		// With the reference date set to 2025-02-05, the `last-28-days` range
		// covers these dates.
		const shared = {
			startDate: '2025-01-09',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			...( url ? { url } : {} ),
		};

		return [
			{
				...shared,
				// The comparison range, the 28 days before the selected range.
				compareStartDate: '2024-12-12',
				compareEndDate: '2025-01-08',
				reportID:
					'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs',
			},
			{
				...shared,
				dimensions: [ 'date' ],
				orderby: [ { dimension: { dimensionName: 'date' } } ],
				reportID:
					'analytics-4_dashboard-all-traffic-widget-ga4_widget_graphArgs',
			},
			{
				...shared,
				dimensions: [ 'sessionDefaultChannelGrouping' ],
				orderby: byTotalUsersDescending,
				reportID:
					'analytics-4_dashboard-all-traffic-widget-ga4_widget_channelsBreakdownArgs',
			},
			{
				...shared,
				dimensions: [ 'country' ],
				orderby: byTotalUsersDescending,
				reportID:
					'analytics-4_dashboard-all-traffic-widget-ga4_widget_locationsBreakdownArgs',
			},
			{
				...shared,
				dimensions: [ 'deviceCategory' ],
				orderby: byTotalUsersDescending,
				reportID:
					'analytics-4_dashboard-all-traffic-widget-ga4_widget_devicesBreakdownArgs',
			},
		];
	}

	/**
	 * Adds a mock report to the store for each argument set it receives.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object[]} expectedArgs The argument sets to add a report under.
	 * @return {void}
	 */
	function provideReports( expectedArgs: ReportOptions[] ) {
		expectedArgs.forEach( ( args ) =>
			provideAnalytics4MockReport( registry, args )
		);
	}

	/**
	 * Gets the argument sets whose `getReport` resolution has finished.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object[]} expectedArgs The argument sets to check.
	 * @return {Object[]} The argument sets the hook has finished resolving.
	 */
	function getResolvedArgs( expectedArgs: ReportOptions[] ) {
		return expectedArgs.filter( ( args ) =>
			registry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getReport', [ args ] )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
	} );

	it( 'sends exactly five report requests', async () => {
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 5, reportEndpoint );
	} );

	it( 'requests the total visitors, daily visitors, channels, locations, and devices reports over the selected range', async () => {
		const expectedArgs = getExpectedArgs();
		provideReports( expectedArgs );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		// The store already holds a report for each of the five argument sets,
		// so the `getReport` resolver sends no request for them. A request for
		// any other arguments reaches `fetchMock`, so the report endpoint
		// is never fetched.
		expect( getResolvedArgs( expectedArgs ) ).toEqual( expectedArgs );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'adds the entity URL to all five reports when the page has an entity URL set', async () => {
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const expectedArgs = getExpectedArgs( 'https://example.com/about/' );
		provideReports( expectedArgs );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( getResolvedArgs( expectedArgs ) ).toEqual( expectedArgs );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'requests no report and leaves loaded false for a view-only user whose role cannot view Analytics', async () => {
		denyAnalyticsAccess( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.loaded ).toBe( false );
	} );

	it( 'sends all five report requests for a view-only user whose role can view Analytics', async () => {
		allowAnalyticsAccess( registry );

		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 5, reportEndpoint );
	} );

	it( 'leaves `loaded` set to `false` while any of the five reports is still loading', async () => {
		freezeFetch( reportEndpoint );

		provideReports( getExpectedArgs().slice( 0, 4 ) );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( false );
	} );

	it( 'sets `loaded` to `true` and leaves `error` undefined after all five reports have finished', async () => {
		provideReports( getExpectedArgs() );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.error ).toBeUndefined();
	} );

	it( 'returns the total visitors report as totalsReport and the daily visitors report as graphReport', async () => {
		const expectedArgs = getExpectedArgs();
		provideReports( expectedArgs );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.totalsReport ).toEqual(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( expectedArgs[ 0 ] )
		);
		expect( result.current.graphReport ).toEqual(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( expectedArgs[ 1 ] )
		);
	} );

	it( 'keys each breakdown report by its column id', async () => {
		const expectedArgs = getExpectedArgs();
		provideReports( expectedArgs );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( Object.keys( result.current.breakdownReports ) ).toEqual( [
			'channels',
			'locations',
			'devices',
		] );
		expect( result.current.breakdownReports.channels ).toEqual(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( expectedArgs[ 2 ] )
		);
		expect( result.current.breakdownReports.locations ).toEqual(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( expectedArgs[ 3 ] )
		);
		expect( result.current.breakdownReports.devices ).toEqual(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( expectedArgs[ 4 ] )
		);
	} );

	it( 'returns the channels error when the channels report and the devices report both fail', async () => {
		const expectedArgs = getExpectedArgs();
		provideReports( expectedArgs );

		const channelsError = {
			code: 'test_error',
			message: 'The channels report failed.',
			data: {},
		};
		const devicesError = {
			code: 'test_error',
			message: 'The devices report failed.',
			data: {},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( channelsError, 'getReport', [
				expectedArgs[ 2 ],
			] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( devicesError, 'getReport', [
				expectedArgs[ 4 ],
			] );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.error ).toEqual( channelsError );
	} );
} );
