/**
 * Traffic Overview `useTrafficReport` hook tests.
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
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import { freezeFetch, provideModules, provideSiteInfo } from '@tests/js/utils';
import { useTrafficReport } from './useTrafficReport';

describe( 'useTrafficReport', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const graphReportOptions = {
		dimensions: [ 'date' ],
		reportID: 'test-graph-report',
	};

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

	it( 'builds the report args from the selected range, the total users metric, and the options it receives', async () => {
		freezeFetch( reportEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficReport( graphReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		// With the reference date set to 2025-02-05, the `last-28-days` range
		// covers these dates.
		expect( result.current.args ).toEqual( {
			startDate: '2025-01-09',
			endDate: '2025-02-05',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'date' ],
			reportID: 'test-graph-report',
		} );
	} );

	it( 'adds the entity URL to the report args when the site has a current entity', async () => {
		freezeFetch( reportEndpoint );

		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficReport( graphReportOptions ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.args.url ).toBe( 'https://example.com/about/' );
	} );

	it( 'requests the report for a view-only user whose role can view Analytics', async () => {
		freezeFetch( reportEndpoint );

		allowAnalyticsAccess( registry );

		const { waitForRegistry } = renderHook(
			() => useTrafficReport( graphReportOptions ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint );
	} );

	it( 'requests no report for a view-only user whose role cannot view Analytics', async () => {
		denyAnalyticsAccess( registry );

		const { result, waitForRegistry } = renderHook(
			() => useTrafficReport( graphReportOptions ),
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.current.report ).toBeUndefined();
	} );

	it( 'requests no report while the widget is out of view', async () => {
		const { waitForRegistry } = renderHook(
			() => useTrafficReport( graphReportOptions ),
			{ registry, inView: false }
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );
} );
