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
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import {
	TRAFFIC_BREAKDOWN_PAIRS,
	createBreakdownReport,
	createBreakdownValues,
	getTrafficBreakdownReportArgs,
	provideTrafficBreakdownReports,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { decodedBenchmarkingResponse } from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import { useTrafficOverviewReports } from './useTrafficOverviewReports';

describe( 'useTrafficOverviewReports', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Builds the arguments the hook passes to `getReport` for the totals
	 * report.
	 *
	 * @since 1.188.0
	 * @since n.e.x.t Builds the totals report's arguments alone.
	 *
	 * @param {string} [url] Optional. The entity URL to add to the arguments.
	 * @return {Object} The expected arguments.
	 */
	function getExpectedArgs( url?: string ): ReportOptions {
		// With the reference date set to 2025-02-05, the `last-28-days` range
		// covers these dates, and the comparison range is the 28 days before.
		return {
			startDate: '2025-01-09',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			...( url ? { url } : {} ),
			compareStartDate: '2024-12-12',
			compareEndDate: '2025-01-08',
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs',
		};
	}

	/**
	 * Builds the arguments the hook passes to `getReport` for the channels,
	 * locations, and devices reports, in that order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [url] Optional. The entity URL to add to the arguments.
	 * @return {Array.<Object>} The expected arguments of each report.
	 */
	function getExpectedBreakdownArgs( url?: string ): ReportOptions[] {
		return [
			[ 'sessionDefaultChannelGrouping', 'channelsBreakdownArgs' ],
			[ 'country', 'locationsBreakdownArgs' ],
			[ 'deviceCategory', 'devicesBreakdownArgs' ],
		].map( ( [ dimensionName, reportIDSuffix ] ) => ( {
			startDate: '2025-01-09',
			endDate: '2025-02-05',
			metrics: [ { name: 'sessions' } ],
			dimensions: [ dimensionName ],
			orderby: [ { metric: { metricName: 'sessions' }, desc: true } ],
			reportID: `analytics-4_dashboard-all-traffic-widget-ga4_widget_${ reportIDSuffix }`,
			...( url ? { url } : {} ),
		} ) );
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

	it( 'should send a request for the totals report and for each of the three breakdown reports', async () => {
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 4, reportEndpoint );
	} );

	it( 'should request the total visitors report over the selected range, against the range before it', async () => {
		const expectedArgs = getExpectedArgs();
		provideAnalytics4MockReport( registry, expectedArgs );
		provideTrafficBreakdownReports( registry );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		// The store already holds the report for these arguments, so the
		// `getReport` resolver sends no request for them. A request for any
		// other arguments reaches `fetchMock`, so the report endpoint is never
		// fetched.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getReport', [ expectedArgs ] )
		).toBe( true );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should request the visits of each channel, country, and device over the selected range, most first', async () => {
		const expectedBreakdownArgs = getExpectedBreakdownArgs();

		provideAnalytics4MockReport( registry, getExpectedArgs() );
		expectedBreakdownArgs.forEach( ( args ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( createBreakdownReport( [] ), {
					options: args,
				} )
		);

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expectedBreakdownArgs.forEach( ( args ) =>
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedResolution( 'getReport', [ args ] )
			).toBe( true )
		);
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should add the entity URL to the reports when the page has an entity URL set', async () => {
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const expectedArgs = [
			getExpectedArgs( 'https://example.com/about/' ),
			...getExpectedBreakdownArgs( 'https://example.com/about/' ),
		];
		expectedArgs.forEach( ( args ) =>
			provideAnalytics4MockReport( registry, args )
		);

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expectedArgs.forEach( ( args ) =>
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedResolution( 'getReport', [ args ] )
			).toBe( true )
		);
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'requests no report and leaves loaded false for a view-only user whose role cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.loaded ).toBe( false );
	} );

	it( 'should send the report requests for a view-only user whose role can view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );

		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		const { waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 4, reportEndpoint );
	} );

	it( 'should leave `loaded` set to `false` while the totals report is still loading', async () => {
		freezeFetch( reportEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( false );
	} );

	it( 'should leave `loaded` set to `false` while a breakdown report is still loading', async () => {
		provideAnalytics4MockReport( registry, getExpectedArgs() );
		freezeFetch( reportEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( false );
	} );

	it( 'should set `loaded` to `true` and return no errors once the reports have finished', async () => {
		provideAnalytics4MockReport( registry, getExpectedArgs() );
		provideTrafficBreakdownReports( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.errors ).toEqual( [] );
	} );

	it( 'should return the total visitors report as totalsReport', async () => {
		const expectedArgs = getExpectedArgs();
		provideAnalytics4MockReport( registry, expectedArgs );
		provideTrafficBreakdownReports( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.totalsReport ).toEqual(
			registry.select( MODULES_ANALYTICS_4 ).getReport( expectedArgs )
		);
	} );

	it( "should return the visits of each breakdown report as its column's values, keyed by the column's id", async () => {
		provideAnalytics4MockReport( registry, getExpectedArgs() );
		provideTrafficBreakdownReports( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.breakdownValues ).toEqual( {
			channels: createBreakdownValues( TRAFFIC_BREAKDOWN_PAIRS.channels ),
			locations: createBreakdownValues(
				TRAFFIC_BREAKDOWN_PAIRS.locations
			),
			devices: createBreakdownValues( TRAFFIC_BREAKDOWN_PAIRS.devices ),
		} );
	} );

	it( 'should return the error of the report when it fails', async () => {
		const expectedArgs = getExpectedArgs();
		const error = {
			code: 'test_error',
			message: 'The total visitors report failed.',
			data: {},
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [ expectedArgs ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ expectedArgs ] );
		provideTrafficBreakdownReports( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.errors ).toEqual( [ error ] );
	} );

	it( 'should return the errors of the totals report and of the breakdown reports in the order the hook requests them', async () => {
		const { channels, locations, devices } =
			getTrafficBreakdownReportArgs( registry );
		const totalsError = {
			code: 'test_error',
			message: 'The total visitors report failed.',
			data: {},
		};
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

		[
			[ totalsError, getExpectedArgs() ],
			[ devicesError, devices ],
			[ channelsError, channels ],
		].forEach( ( [ error, args ] ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setErrorForSelector( error, 'getReport', [ args ] );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ args ] );
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( createBreakdownReport( [] ), {
				options: locations,
			} );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficOverviewReports(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.errors ).toEqual( [
			totalsError,
			channelsError,
			devicesError,
		] );
	} );

	describe( 'the benchmarking response', () => {
		const benchmarkingEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
		);

		const benchmarkingError = {
			code: 'internal_server_error',
			message: 'The benchmarking request failed.',
			data: { status: 500 },
		};

		beforeEach( () => {
			// The hook reads whether the property is gathering data to tell
			// whether the panel has the key factors.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( false );
			provideTrafficBreakdownReports( registry );
		} );

		/**
		 * Stores an error for the benchmarking request over the selected
		 * range, and finishes its resolution, so the store sends no request.
		 *
		 * @since n.e.x.t
		 *
		 * @return {void}
		 */
		function provideBenchmarkingError() {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setErrorForSelector(
					benchmarkingError,
					'getBenchmarkingData',
					[ '2025-01-09', '2025-02-05' ]
				);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getBenchmarkingData', [
					'2025-01-09',
					'2025-02-05',
				] );
		}

		it( 'should request the benchmarking response for the selected range, and return it, on the main dashboard with the typicalTraffic feature', async () => {
			provideAnalytics4MockReport( registry, getExpectedArgs() );
			fetchMock.get( benchmarkingEndpoint, {
				body: benchmarkingData,
				status: 200,
			} );

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, benchmarkingEndpoint, {
				query: { startDate: '2025-01-09', endDate: '2025-02-05' },
			} );
			expect( result.current.benchmarkingResponse ).toEqual(
				decodedBenchmarkingResponse
			);
			expect( result.current.loaded ).toBe( true );
			expect( result.current.errors ).toEqual( [] );
		} );

		it( 'should not request the benchmarking response, or wait for it, without the typicalTraffic feature', async () => {
			provideAnalytics4MockReport( registry, getExpectedArgs() );

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			await waitForRegistry();

			// `fetchMock` answers no benchmarking request in this test, so a
			// request would fail it.
			expect( fetchMock ).not.toHaveFetched( benchmarkingEndpoint );
			expect( result.current.benchmarkingResponse ).toBeUndefined();
			expect( result.current.loaded ).toBe( true );
		} );

		it( 'should not request the benchmarking response, or wait for it, on the entity dashboard', async () => {
			provideSiteInfo( registry, {
				currentEntityURL: 'https://example.com/about/',
			} );
			provideAnalytics4MockReport(
				registry,
				getExpectedArgs( 'https://example.com/about/' )
			);
			provideTrafficBreakdownReports( registry );

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).not.toHaveFetched( benchmarkingEndpoint );
			expect( result.current.benchmarkingResponse ).toBeUndefined();
			expect( result.current.loaded ).toBe( true );
		} );

		it( 'should leave `loaded` set to `false` while the benchmarking response is still loading', async () => {
			provideAnalytics4MockReport( registry, getExpectedArgs() );
			freezeFetch( benchmarkingEndpoint );

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( result.current.loaded ).toBe( false );
		} );

		it( 'should set `loaded` to `true` and return the error of the benchmarking request when it fails', async () => {
			provideAnalytics4MockReport( registry, getExpectedArgs() );
			provideBenchmarkingError();

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( result.current.loaded ).toBe( true );
			expect( result.current.errors ).toEqual( [ benchmarkingError ] );
		} );

		it( 'should return the error of the totals report before the error of the benchmarking request when both fail', async () => {
			const expectedArgs = getExpectedArgs();
			const totalsError = {
				code: 'test_error',
				message: 'The total visitors report failed.',
				data: {},
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setErrorForSelector( totalsError, 'getReport', [
					expectedArgs,
				] );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ expectedArgs ] );
			provideBenchmarkingError();

			const { result, waitForRegistry } = renderHook(
				() => useTrafficOverviewReports(),
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( result.current.errors ).toEqual( [
				totalsError,
				benchmarkingError,
			] );
		} );
	} );
} );
