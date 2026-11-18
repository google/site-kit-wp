/**
 * SeeAllRecentPostsLink component tests.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import ModulePopularPagesWidgetGA4 from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4';
import { LATEST_CONTENT_RECENT_CONTENT_OPTIONS } from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/constants';
import { RECENT_ACTIVITY_INTERACTION_TIMER } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	EARLIER_POST,
	LATEST_POST,
	provideRecentActivitySurveyState,
	setExpirableItemTimersEndpoint,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import * as scrollUtils from '@/js/util/scroll';
import * as tracking from '@/js/util/tracking';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	provideUserInfo,
} from '@tests/js/utils';
import SeeAllRecentPostsLink from './SeeAllRecentPostsLink';

describe( 'SeeAllRecentPostsLink', () => {
	let registry: WPDataRegistry;

	const postsEndpoint = new RegExp( '^/wp/v2/posts' );
	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const widgetComponentProps = getWidgetComponentProps(
		'analyticsModulePopularPagesGA4'
	);

	const getNavigationalScrollTopSpy = jest.spyOn(
		scrollUtils,
		'getNavigationalScrollTop'
	);
	const scrollToSpy = jest.spyOn( global, 'scrollTo' );

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		mockTrackEvent.mockClear();

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
		provideRecentActivitySurveyState( registry );
		fetchMock.post( setExpirableItemTimersEndpoint, {
			body: {},
			status: 200,
		} );
		getNavigationalScrollTopSpy.mockReturnValue( 100 );
		scrollToSpy.mockClear();
	} );

	afterEach( () => {
		global.history.replaceState( {}, '', '/' );
	} );

	// A click records an interaction, so the tests wait for its request
	// rather than let it finish during the next test.
	async function waitForInteraction() {
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint )
		);
		await act( () => new Promise( ( resolve ) => setTimeout( resolve ) ) );
	}

	// The card's reports stay loading, as right after the dashboard loads.
	// The card renders only the selected tab's table, and each table requests
	// its own report, so up to two requests stay pending.
	function provideContentCardWithLoadingReports() {
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideModuleRegistrations( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		freezeFetch( reportEndpoint, { repeat: 2 } );
	}

	it( 'should render the link when the site has two or more recent posts', () => {
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);

		render( <SeeAllRecentPostsLink />, { registry } );

		expect(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'one recent post', [ LATEST_POST ] ],
		[ 'no recent posts', [] ],
	] )(
		'should render nothing when the site has %s',
		( _description, recentContent ) => {
			provideRecentContent(
				registry,
				recentContent,
				LATEST_CONTENT_RECENT_CONTENT_OPTIONS
			);

			const { container } = render( <SeeAllRecentPostsLink />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it( 'should render nothing while the recent posts are loading', async () => {
		freezeFetch( postsEndpoint );

		const { container } = render( <SeeAllRecentPostsLink />, {
			registry,
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( postsEndpoint )
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the request for the recent posts fails', async () => {
		fetchMock.get( postsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render(
			<SeeAllRecentPostsLink />,
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( postsEndpoint );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing, and should not request the recent posts, for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { container, waitForRegistry } = render(
			<SeeAllRecentPostsLink />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
	} );

	it( 'should select the Latest content tab, set the URL hash to `#content`, and scroll smoothly to the content card when clicked', async () => {
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);

		render(
			<Fragment>
				<SeeAllRecentPostsLink />
				<div id="googlesitekit-content-card" />
			</Fragment>,
			{ registry }
		);

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-latest-content-tab' );
		expect( global.location.hash ).toBe( '#content' );
		expect( getNavigationalScrollTopSpy ).toHaveBeenCalledWith(
			'#googlesitekit-content-card',
			'desktop'
		);
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 100,
			behavior: 'smooth',
		} );

		await waitForInteraction();
	} );

	it( "should move focus to the Latest content tab, and select it, when clicked while the content card's reports are still loading", async () => {
		provideContentCardWithLoadingReports();
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);

		render(
			<Fragment>
				<SeeAllRecentPostsLink />
				<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />
			</Fragment>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		const latestContentTab = screen.getByRole( 'tab', {
			name: 'Latest content',
		} );
		const focusSpy = jest.spyOn( latestContentTab, 'focus' );

		// A screen reader announces whether the tab is selected at the moment
		// it gets focus, so the test records `aria-selected` then.
		let ariaSelectedOnFocus: string | null = null;
		latestContentTab.addEventListener( 'focus', () => {
			ariaSelectedOnFocus =
				latestContentTab.getAttribute( 'aria-selected' );
		} );

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		await waitForInteraction();

		expect( latestContentTab ).toHaveFocus();
		expect( ariaSelectedOnFocus ).toBe( 'true' );
		expect( latestContentTab ).toHaveAttribute( 'aria-selected', 'true' );
		// JSDOM ignores `preventScroll`, so the spy checks the option.
		expect( focusSpy ).toHaveBeenCalledWith( { preventScroll: true } );
	} );

	it( 'should scroll to the content card and move focus to the Latest content tab when Latest content is already selected', async () => {
		provideContentCardWithLoadingReports();
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setActiveContentTab( 'googlesitekit-latest-content-tab' );

		render(
			<Fragment>
				<SeeAllRecentPostsLink />
				<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />
			</Fragment>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		await waitForInteraction();

		expect( getNavigationalScrollTopSpy ).toHaveBeenCalledWith(
			'#googlesitekit-content-card',
			'desktop'
		);
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 100,
			behavior: 'smooth',
		} );
		expect(
			screen.getByRole( 'tab', { name: 'Latest content' } )
		).toHaveFocus();
	} );

	it( 'should record an interaction when clicked', async () => {
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);

		render( <SeeAllRecentPostsLink />, { registry } );

		expect( fetchMock ).not.toHaveFetched( setExpirableItemTimersEndpoint );

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		await waitForInteraction();

		expect( fetchMock ).toHaveFetched( setExpirableItemTimersEndpoint, {
			body: {
				data: [
					{
						slug: RECENT_ACTIVITY_INTERACTION_TIMER.slug,
						expiration:
							RECENT_ACTIVITY_INTERACTION_TIMER.expiresInSeconds,
					},
				],
			},
		} );
	} );

	it( 'should track `change_tab` under `mainDashboard_content-tabs` labeled `googlesitekit-latest-content-tab` when clicked', async () => {
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);

		render( <SeeAllRecentPostsLink />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_content-tabs',
			'change_tab',
			'googlesitekit-latest-content-tab'
		);

		await waitForInteraction();
	} );

	it( 'should not track `change_tab` when the Latest content tab is already active', async () => {
		provideRecentContent(
			registry,
			[ LATEST_POST, EARLIER_POST ],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setActiveContentTab( 'googlesitekit-latest-content-tab' );

		render( <SeeAllRecentPostsLink />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fireEvent.click(
			screen.getByRole( 'link', { name: 'See all recent posts' } )
		);

		expect( mockTrackEvent ).not.toHaveBeenCalled();

		await waitForInteraction();
	} );
} );
