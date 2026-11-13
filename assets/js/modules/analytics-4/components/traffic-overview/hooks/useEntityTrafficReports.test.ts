/**
 * Traffic Overview `useEntityTrafficReports` hook tests.
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
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
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
import { useEntityTrafficReports } from './useEntityTrafficReports';

describe( 'useEntityTrafficReports', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const entityURL = 'https://example.com/about/';

	// With the reference date set to 2025-02-05, the `last-28-days` range
	// covers these dates.
	const totalsArgs: ReportOptions = {
		startDate: '2025-01-09',
		endDate: '2025-02-05',
		metrics: [ { name: 'totalUsers' } ],
		reportID:
			'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs',
		url: entityURL,
	};

	const dailyVisitsArgs: ReportOptions = {
		startDate: '2025-01-09',
		endDate: '2025-02-05',
		metrics: [ { name: 'sessions' } ],
		dimensions: [ 'date' ],
		reportID:
			'analytics-4_dashboard-all-traffic-widget-ga4_widget_dailyVisitsArgs',
		url: entityURL,
	};

	/**
	 * Stores an error for the report under the given arguments, and finishes
	 * its resolution, so the store sends no request for it.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} error The error the report failed with.
	 * @param {Object} args  The report's arguments.
	 * @return {void}
	 */
	function provideReportError(
		error: Record< string, unknown >,
		args: ReportOptions
	) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [ args ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ args ] );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
	} );

	it( 'should request the unique visitors over the selected range, and the visits on each of its days, for the entity URL', async () => {
		provideAnalytics4MockReport( registry, totalsArgs );
		provideAnalytics4MockReport( registry, dailyVisitsArgs );

		const { waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		await waitForRegistry();

		// The store already holds both reports for these arguments, so the
		// `getReport` resolver sends no request for them. A request for any
		// other arguments reaches `fetchMock`, so the report endpoint is never
		// fetched.
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getReport', [ totalsArgs ] )
		).toBe( true );
		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getReport', [ dailyVisitsArgs ] )
		).toBe( true );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should return the totals report and the daily visits report', async () => {
		provideAnalytics4MockReport( registry, totalsArgs );
		provideAnalytics4MockReport( registry, dailyVisitsArgs );

		const { result, waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		await waitForRegistry();

		expect( result.current.totalsReport ).toEqual(
			registry.select( MODULES_ANALYTICS_4 ).getReport( totalsArgs )
		);
		expect( result.current.dailyVisitsReport ).toEqual(
			registry.select( MODULES_ANALYTICS_4 ).getReport( dailyVisitsArgs )
		);
	} );

	it( 'should leave `loaded` set to `false` while a report is still loading', async () => {
		provideAnalytics4MockReport( registry, totalsArgs );
		freezeFetch( reportEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( false );
	} );

	it( 'should set `loaded` to `true` and return no errors once both reports have finished', async () => {
		provideAnalytics4MockReport( registry, totalsArgs );
		provideAnalytics4MockReport( registry, dailyVisitsArgs );

		const { result, waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.errors ).toEqual( [] );
	} );

	it( 'should return the error of each report that fails, the totals report first', async () => {
		const totalsError = {
			code: 'test_error',
			message: 'The totals report failed.',
			data: {},
		};
		const dailyVisitsError = {
			code: 'test_error',
			message: 'The daily visits report failed.',
			data: {},
		};

		provideReportError( dailyVisitsError, dailyVisitsArgs );
		provideReportError( totalsError, totalsArgs );

		const { result, waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD }
		);

		await waitForRegistry();

		expect( result.current.loaded ).toBe( true );
		expect( result.current.errors ).toEqual( [
			totalsError,
			dailyVisitsError,
		] );
	} );

	it( 'should request no report, and leave `loaded` set to `false`, for a view-only user whose role cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useEntityTrafficReports(),
			{ registry, viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.loaded ).toBe( false );
	} );
} );
