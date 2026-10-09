/**
 * Traffic Overview widget tests.
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
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { TRAFFIC_OVERVIEW_WIDGET_SLUG } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { mockIntersectionObserver } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
} from '@tests/js/utils';
import TrafficOverviewWidget from './TrafficOverviewWidget';

describe( 'TrafficOverviewWidget', () => {
	let registry: WPDataRegistry;

	const widgetComponentProps = getWidgetComponentProps(
		TRAFFIC_OVERVIEW_WIDGET_SLUG
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const postsEndpoint = new RegExp( '^/wp/v2/posts' );

	const searchAnalyticsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
	);

	// When Analytics is not connected, the widget renders
	// `ActivateAnalyticsCTA`, which needs an `IntersectionObserver` that jsdom
	// doesn't have.
	mockIntersectionObserver();

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
		// Storing the creation time stops a request for the Analytics property.
		// `2024-01-01` sits before the selected range, so the chart draws no
		// marker.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( '2024-01-01T00:00:00Z' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'renders the widget with no header', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-widget--analyticsTrafficOverview'
			)
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__header' )
		).toBeNull();
	} );

	it( 'renders one tab labeled "Traffic overview" at the top of the widget body', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 1 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Traffic overview' );
		expect(
			container.querySelector( '.googlesitekit-widget__body' )
				?.firstElementChild
		).toHaveClass( 'googlesitekit-scrollable-tabs' );
	} );

	it( 'names the tab panel after the "Traffic overview" tab', async () => {
		const { waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			screen.getByRole( 'tabpanel', { name: 'Traffic overview' } )
		).toBeInTheDocument();
	} );

	it( 'renders a widget footer with the text "Source: Analytics" and a link to Analytics', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		const footer = container.querySelector(
			'.googlesitekit-widget__footer'
		);

		expect( footer ).toHaveTextContent( 'Source: Analytics' );
		expect( footer ).toContainElement(
			screen.getByRole( 'link', {
				name: 'Analytics (opens in a new tab)',
			} )
		);
	} );

	it( 'renders the tab bar and the "Source: Analytics" footer while the five reports load', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				inView: false,
			}
		);

		await waitForRegistry();

		expect(
			screen.getByRole( 'tab', { name: 'Traffic overview' } )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__footer' )
		).toHaveTextContent( 'Source: Analytics' );
		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
	} );

	it( 'renders the tab bar and the "Source: Analytics" footer when a report fails', async () => {
		const { startDate, endDate } = registry
			.select( CORE_USER )
			.getDateRangeDates();
		const graphReportArgs = getGraphReportArgs( { startDate, endDate } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The daily visitors report failed.',
				data: { status: 500, reason: 'backendError' },
			},
			'getReport',
			[ graphReportArgs ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ graphReportArgs ] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			screen.getByText( 'The daily visitors report failed.' )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'tab', { name: 'Traffic overview' } )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__footer' )
		).toHaveTextContent( 'Source: Analytics' );
	} );

	it( 'renders nothing when Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: false,
			},
		] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not sends a report request when the widget is out of view', async () => {
		const { waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				inView: false,
			}
		);

		await waitForRegistry();

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'sends the five report requests when the widget scrolls into view', async () => {
		const { setInView, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				inView: false,
			}
		);

		await waitForRegistry();

		act( () => setInView!( true ) );

		// The five requests do not all start on the render that brings the
		// widget into view, so this check waits for the count to reach five.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 5, reportEndpoint )
		);
	} );

	it( 'should show a "Recent activity" tab with a "Beta" badge after the "Traffic overview" tab when the `freshData` feature flag is enabled', async () => {
		const { waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 2 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Traffic overview' );
		expect( tabs[ 1 ] ).toHaveTextContent( 'Recent activity' );
		expect( within( tabs[ 1 ] ).getByText( 'Beta' ) ).toBeInTheDocument();
	} );

	it( 'should render the Recent activity panel and the "Sources: Analytics Search Console" footer when the `freshData` feature flag is enabled and the user selects the "Recent activity" tab', async () => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.setPropertyID( 'https://example.com/' );
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
		fetchMock.get( searchAnalyticsEndpoint, { body: [], status: 200 } );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		fireEvent.click(
			screen.getByRole( 'tab', { name: 'Recent activity Beta' } )
		);

		// Selecting the Recent activity tab renders `RecentActivityPanel`, which
		// starts requests of its own. We wait again here for those requests,
		// because a response that arrives during the next test fails that test
		// on an `act()` warning.
		await waitForRegistry();

		expect(
			screen.getByRole( 'tabpanel', { name: 'Recent activity Beta' } )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__footer' )
		).toHaveTextContent( 'Sources: Analytics Search Console' );
	} );

	it( 'should show the "Recent activity" tab alone, with a "Set up Analytics" button and no footer, when the `freshData` feature flag is enabled and Analytics is not connected', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 1 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Recent activity' );
		expect(
			screen.getByRole( 'button', { name: 'Set up Analytics' } )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-widget__footer' )
		).toBeNull();
	} );

	it( 'should render nothing when the `freshData` feature flag is enabled, Analytics is not connected, and the user has dismissed the Analytics setup CTA', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				'analytics-setup-cta-recent-activity',
			] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should show the "Traffic overview" tab alone when the `freshData` feature flag is enabled and the widget is on the entity dashboard', async () => {
		const { waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 1 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Traffic overview' );
	} );

	it( 'should render nothing when the `freshData` feature flag is enabled, Analytics is not connected, and the widget is on the entity dashboard', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing, and should keep the widget active, when the `freshData` feature flag is enabled, Analytics is not connected, and the dismissed items have not loaded', async () => {
		const dismissedItemsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismissed-items'
		);

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		// `isItemDismissed()` and `getDismissedItems()` each have a resolver,
		// and each resolver requests the dismissed items.
		freezeFetch( dismissedItemsEndpoint, { repeat: 2 } );

		const { container } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( dismissedItemsEndpoint )
		);

		expect( container ).toBeEmptyDOMElement();
		expect(
			registry
				.select( CORE_WIDGETS )
				.isWidgetActive( TRAFFIC_OVERVIEW_WIDGET_SLUG )
		).toBe( true );
	} );

	it( 'should render nothing, and should mark the widget as inactive, when the `freshData` feature flag is enabled, Analytics is not connected, and the dismissed items fail to load', async () => {
		const dismissedItemsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismissed-items'
		);

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		fetchMock.get( dismissedItemsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( container ).toBeEmptyDOMElement();
		expect(
			registry
				.select( CORE_WIDGETS )
				.isWidgetActive( TRAFFIC_OVERVIEW_WIDGET_SLUG )
		).toBe( false );
	} );

	it( 'should show the "Recent activity" tab with a "Set up Analytics" button when the `freshData` feature flag is enabled, Analytics is not connected, the dismissed items fail to load, and the user then dismisses another item', async () => {
		const dismissedItemsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismissed-items'
		);
		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		fetchMock.get( dismissedItemsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );
		// The response to `dismissItem()` lists every dismissed item, and
		// `CORE_USER` stores that list, so the widget knows the user hasn't
		// dismissed the Analytics setup CTA.
		fetchMock.post( dismissItemEndpoint, {
			body: [ 'another-item' ],
			status: 200,
		} );

		const { container, waitForRegistry } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect( container ).toBeEmptyDOMElement();

		await act( () =>
			registry.dispatch( CORE_USER ).dismissItem( 'another-item' )
		);

		const tabs = screen.getAllByRole( 'tab' );

		expect( tabs ).toHaveLength( 1 );
		expect( tabs[ 0 ] ).toHaveTextContent( 'Recent activity' );
		expect(
			screen.getByRole( 'button', { name: 'Set up Analytics' } )
		).toBeInTheDocument();
	} );

	it( 'should render nothing when the `freshData` feature flag is enabled and the list of modules has not loaded', async () => {
		const modulesEndpoint = new RegExp(
			'^/google-site-kit/v1/core/modules/data/list'
		);

		registry = createTestRegistry();
		provideUserInfo( registry );
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		freezeFetch( modulesEndpoint );

		const { container } = render(
			<TrafficOverviewWidget { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( modulesEndpoint )
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
