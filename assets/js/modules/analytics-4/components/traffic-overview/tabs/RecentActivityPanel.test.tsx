/**
 * Recent activity panel tests.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { mockIntersectionObserver } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import RecentActivityPanel from './RecentActivityPanel';

describe( 'RecentActivityPanel', () => {
	let registry: WPDataRegistry;

	const postsEndpoint = new RegExp( '^/wp/v2/posts' );

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	// `ActivateAnalyticsCTA` observes when it scrolls into view, and jsdom
	// has no `IntersectionObserver`.
	mockIntersectionObserver();

	/**
	 * Gets the class name of each element the panel renders directly inside
	 * it, in the order the elements appear.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The element the panel rendered into.
	 * @return {Array<string>} The class names.
	 */
	function getSectionClassNames( container: Element ) {
		return Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__panel > *'
			)
		).map( ( section ) => section.className );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		// Storing the settings stops a request for them when the recent posts
		// load.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		fetchMock.get( postsEndpoint, {
			body: [
				{
					id: 12,
					date_gmt: '2026-09-24T14:05:00',
					link: 'http://example.com/autumn-recipes/',
					title: { rendered: 'Autumn recipes' },
				},
			],
			status: 200,
		} );
	} );

	it( 'should mark the panel as a tab panel and name it using the content in the "Recent activity" tab', async () => {
		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry }
		);

		await waitForRegistry();

		const panel = container.querySelector(
			'.googlesitekit-traffic-overview__panel'
		);

		expect( panel ).toHaveAttribute( 'role', 'tabpanel' );
		expect( panel ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-recent-activity-tab'
		);
	} );

	it( 'should render the insight notice, the fresh metrics row, the recent traffic breakdown, and the latest post performance in that order', async () => {
		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__insight-notice',
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__recent-traffic-breakdown',
			'googlesitekit-traffic-overview__latest-post-performance',
		] );
	} );

	it( 'should render the "Set up Analytics" button in place of the sections when Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { waitForRegistry } = render( <RecentActivityPanel />, {
			registry,
		} );

		await waitForRegistry();

		const panel = screen.getByRole( 'tabpanel' );

		expect( panel ).toContainElement(
			screen.getByRole( 'button', { name: 'Set up Analytics' } )
		);
		expect( panel.children ).toHaveLength( 1 );
	} );

	it( 'should not request the recent posts when Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { waitForRegistry } = render( <RecentActivityPanel />, {
			registry,
		} );

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
	} );

	it( 'should render the "No recent visitor data yet" notice in place of the insight notice and the recent traffic breakdown when Analytics is gathering data', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			screen.getByText( 'No recent visitor data yet' )
		).toBeInTheDocument();
		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-notice-container',
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__latest-post-performance',
		] );
	} );

	it( 'should not render the insight notice or the recent traffic breakdown when it is not yet known whether Analytics is gathering data', async () => {
		// We create a registry that doesn't know whether Analytics is gathering
		// data, and the report request that would tell the registry never
		// finishes.
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		freezeFetch( reportEndpoint );

		const { container } = render( <RecentActivityPanel />, { registry } );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( reportEndpoint )
		);

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__latest-post-performance',
		] );
	} );

	it( 'should not render the latest post performance when the site has no published posts', async () => {
		fetchMock.get(
			postsEndpoint,
			{ body: [], status: 200 },
			{ overwriteRoutes: true }
		);

		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__insight-notice',
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__recent-traffic-breakdown',
		] );
	} );

	it( 'should render the four sections when the request for the recent posts fails', async () => {
		fetchMock.get(
			postsEndpoint,
			{
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			},
			{ overwriteRoutes: true }
		);

		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__insight-notice',
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__recent-traffic-breakdown',
			'googlesitekit-traffic-overview__latest-post-performance',
		] );
	} );

	it( 'should not request the recent posts when the panel is out of view', async () => {
		const { waitForRegistry } = render( <RecentActivityPanel />, {
			registry,
			inView: false,
		} );

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
	} );

	it( 'should render the fresh metrics row and the latest post performance alone, and should not request a report, for a view-only user who cannot view Analytics', async () => {
		// We create a registry that doesn't know whether Analytics is gathering
		// data, so that calling `isGatheringData()` would request a report.
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );

		const { container, waitForRegistry } = render(
			<RecentActivityPanel />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__fresh-metrics-row',
			'googlesitekit-traffic-overview__latest-post-performance',
		] );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );
} );
