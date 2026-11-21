/**
 * Traffic Overview `useBenchmarkingInsight` hook tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	benchmarkingInsight,
	decodedBenchmarkingResponse,
	provideBenchmarkingData,
	provideBenchmarkingInsight,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { act, createTestRegistry, renderHook } from '@tests/js/test-utils';
import {
	createWaitForRegistry,
	freezeFetch,
	provideModules,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { useBenchmarkingInsight } from './useBenchmarkingInsight';

describe( 'useBenchmarkingInsight', () => {
	// With the reference date below, `last-28-days` runs from `2025-01-09` to
	// `2025-02-05`.
	const dates = { startDate: '2025-01-09', endDate: '2025-02-05' };

	const benchmarkingDataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
	);
	const insightEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-insight'
	);

	const internalServerError = {
		code: 'internal_server_error',
		message: 'Internal server error',
		data: { status: 500 },
	};

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
	} );

	/**
	 * Gives a view-only user's role the capability to view Analytics, or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  args                  The capability.
	 * @param {boolean} args.canViewAnalytics Whether the role can view Analytics.
	 * @return {void}
	 */
	function provideSharedAnalytics( {
		canViewAnalytics,
	}: {
		canViewAnalytics: boolean;
	} ) {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: canViewAnalytics,
		} );
	}

	/**
	 * Checks whether the store has started to resolve the insight of the
	 * selected date range.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} Whether it has started.
	 */
	function hasRequestedInsight() {
		return registry
			.select( MODULES_ANALYTICS_4 )
			.hasStartedResolution( 'getBenchmarkingInsight', [
				dates.startDate,
				dates.endDate,
			] );
	}

	it( 'should return the insight of the selected date range', () => {
		provideBenchmarkingData( registry, dates );
		provideBenchmarkingInsight( registry, dates );

		const { result } = renderHook( () => useBenchmarkingInsight(), {
			registry,
		} );

		expect( result.current ).toEqual( {
			insight: benchmarkingInsight,
			loading: false,
		} );
	} );

	it( 'should return `true` for `loading` while the insight loads', () => {
		provideBenchmarkingData( registry, dates );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getBenchmarkingInsight', [
				dates.startDate,
				dates.endDate,
			] );

		const { result } = renderHook( () => useBenchmarkingInsight(), {
			registry,
		} );

		expect( result.current ).toEqual( { insight: null, loading: true } );
	} );

	it( 'should return `true` for `loading`, and not request the insight, while the benchmarking response loads', async () => {
		freezeFetch( benchmarkingDataEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingInsight(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( { insight: null, loading: true } );
		expect( hasRequestedInsight() ).toBe( false );
	} );

	it( 'should request the insight from the request of the benchmarking response, and return it', async () => {
		provideBenchmarkingData( registry, dates, {
			...decodedBenchmarkingResponse,
			insightLocale: 'en_US',
			insightPayload: 'signed-payload',
		} );
		fetchMock.postOnce( insightEndpoint, {
			body: { insight: benchmarkingInsight },
		} );

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingInsight(),
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( insightEndpoint, {
			method: 'POST',
			body: { data: { payload: 'signed-payload' } },
		} );
		expect( result.current ).toEqual( {
			insight: benchmarkingInsight,
			loading: false,
		} );
	} );

	it( 'should return no insight, and not `loading`, when the request for the insight fails', async () => {
		provideBenchmarkingData( registry, dates, {
			...decodedBenchmarkingResponse,
			insightLocale: 'en_US',
			insightPayload: 'signed-payload',
		} );
		fetchMock.postOnce( insightEndpoint, {
			body: internalServerError,
			status: 500,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingInsight(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toEqual( { insight: null, loading: false } );
	} );

	it( 'should return no insight, and not `loading`, when the request for the benchmarking response fails, and request the insight once a retry brings the response', async () => {
		fetchMock.getOnce( benchmarkingDataEndpoint, {
			body: internalServerError,
			status: 500,
		} );
		fetchMock.getOnce( benchmarkingDataEndpoint, {
			body: [ ...benchmarkingData, 'en_US', 'signed-payload' ],
		} );
		fetchMock.postOnce( insightEndpoint, {
			body: { insight: benchmarkingInsight },
		} );

		const { result, waitForRegistry } = renderHook(
			() => useBenchmarkingInsight(),
			{ registry }
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( result.current ).toEqual( { insight: null, loading: false } );
		expect( hasRequestedInsight() ).toBe( false );

		const waitForRetry = createWaitForRegistry( registry );

		act( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getBenchmarkingData', [
					dates.startDate,
					dates.endDate,
				] );
		} );

		await waitForRetry();

		expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );
		expect( result.current ).toEqual( {
			insight: benchmarkingInsight,
			loading: false,
		} );
	} );

	it( 'should send no request and return no insight when `isEnabled` is `false`', () => {
		const { result } = renderHook(
			() => useBenchmarkingInsight( { isEnabled: false } ),
			{ registry }
		);

		expect( result.current ).toEqual( { insight: null, loading: false } );
		expect( fetchMock ).not.toHaveFetched( benchmarkingDataEndpoint );
		expect( fetchMock ).not.toHaveFetched( insightEndpoint );
		expect( hasRequestedInsight() ).toBe( false );
	} );

	it( 'should send one request for the insight when the hook is used twice, as the panel and the footer use it', async () => {
		provideBenchmarkingData( registry, dates, {
			...decodedBenchmarkingResponse,
			insightLocale: 'en_US',
			insightPayload: 'signed-payload',
		} );
		fetchMock.postOnce( insightEndpoint, {
			body: { insight: benchmarkingInsight },
		} );

		const { result, waitForRegistry } = renderHook(
			() => [ useBenchmarkingInsight(), useBenchmarkingInsight() ],
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
			method: 'POST',
		} );
		expect( result.current ).toEqual( [
			{ insight: benchmarkingInsight, loading: false },
			{ insight: benchmarkingInsight, loading: false },
		] );
	} );

	it( 'should not request the insight of a response that carries its request when the hook is disabled', async () => {
		provideBenchmarkingData( registry, dates, {
			...decodedBenchmarkingResponse,
			insightLocale: 'en_US',
			insightPayload: 'signed-payload',
		} );

		const { result } = renderHook(
			() => useBenchmarkingInsight( { isEnabled: false } ),
			{ registry }
		);

		// A resolver starts in a timeout, so the wait gives one the time to
		// start.
		await act( async () => {
			await waitForDefaultTimeouts();
		} );

		expect( result.current ).toEqual( { insight: null, loading: false } );
		expect( hasRequestedInsight() ).toBe( false );
		expect( fetchMock ).not.toHaveFetched( insightEndpoint );
	} );

	it( 'should send no request for a view-only user whose role cannot view Analytics', () => {
		provideSharedAnalytics( { canViewAnalytics: false } );

		const { result } = renderHook( () => useBenchmarkingInsight(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toEqual( { insight: null, loading: false } );
		expect( fetchMock ).not.toHaveFetched( benchmarkingDataEndpoint );
		expect( fetchMock ).not.toHaveFetched( insightEndpoint );
		expect( hasRequestedInsight() ).toBe( false );
	} );

	it( 'should return the insight for a view-only user whose role can view Analytics', () => {
		provideSharedAnalytics( { canViewAnalytics: true } );
		provideBenchmarkingData( registry, dates );
		provideBenchmarkingInsight( registry, dates );

		const { result } = renderHook( () => useBenchmarkingInsight(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toEqual( {
			insight: benchmarkingInsight,
			loading: false,
		} );
	} );
} );
