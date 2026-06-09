/**
 * SearchFunnelWidgetGA4 component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { mocked } from 'jest-mock';
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ANALYTICS_SETUP_ERROR,
	MODULE_SLUG_ANALYTICS_4,
} from '@/js/modules/analytics-4/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { getViewportWidth, setViewportWidth } from '@tests/js/viewport-utils';
import SearchFunnelWidgetGA4 from '.';

jest.mock( 'react-use', () => ( {
	...( jest.requireActual( 'react-use' ) as Record< string, unknown > ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SearchFunnelWidgetGA4', () => {
	mockLocation();
	let registry: WPDataRegistry;
	let originalViewport: number;

	const widgetComponentProps = getWidgetComponentProps( 'searchFunnel' );

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const activateEndpoint = new RegExp(
		'^/google-site-kit/v1/core/modules/data/activation'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
			propertyID: 'http://example.com/',
		} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{
				body: [
					{
						clicks: 123,
						ctr: 4.56,
						impressions: 7890,
						keys: [ '2022-06-21' ],
						position: 12.345,
					},
				],
			}
		);

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);

		originalViewport = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewport );
		jest.resetAllMocks();
	} );

	it( 'should render the Search Funnel Widget, including the Activate Analytics CTA', async () => {
		const { container, getByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( /Set up Google Analytics/ ) ).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics CTA when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				( coreModulesFixture as { slug: string }[] ).filter(
					( { slug } ) => slug !== MODULE_SLUG_ANALYTICS_4
				)
			);

		const { container, queryByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Set up Google Analytics/ )
		).not.toBeInTheDocument();
	} );

	it( 'should track the `view_cta` event when the Activate Analytics CTA is viewed', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { rerender } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		mocked( mockUseIntersection ).mockImplementation(
			() =>
				( {
					isIntersecting: true,
					intersectionRatio: 1,
				} as unknown as IntersectionObserverEntry )
		);

		rerender( <SearchFunnelWidgetGA4 { ...widgetComponentProps } /> );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'view_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `dismiss_cta` event when the "Maybe later" button is clicked in the Activate Analytics CTA', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'dismiss_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `confirm_cta` event when the "Set up Analytics" button is clicked in the Activate Analytics CTA', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'confirm_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `click_learn_more_link` event when the "Learn more" link is clicked in the Activate Analytics CTA', async () => {
		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'click_learn_more_link',
			'search_funnel'
		);
	} );

	it( 'should render activation error state and dismiss CTA when "Got it" is clicked', async () => {
		registry.dispatch( CORE_SITE ).setInternalServerError( {
			id: ANALYTICS_SETUP_ERROR,
			description: 'This is an error',
		} );

		const { getByText, getByRole, queryByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh', 'setupFlowRefreshPhase4' ],
			}
		);

		await waitForRegistry();

		expect( getByText( 'Analytics setup failed' ) ).toBeInTheDocument();
		expect(
			getByText( 'Something went wrong, please try again' )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: 'Got it' } ) );

		await waitFor( () => {
			expect(
				registry.select( CORE_SITE ).getInternalServerError()
			).toBeUndefined();
			expect(
				registry
					.select( CORE_USER )
					.isItemDismissed( 'analytics-setup-cta-search-funnel' )
			).toBe( true );
			expect(
				queryByText( 'Analytics setup failed' )
			).not.toBeInTheDocument();
		} );
	} );

	it( 'should retry activation when "Retry Analytics setup" is clicked', async () => {
		registry.dispatch( CORE_SITE ).setInternalServerError( {
			id: ANALYTICS_SETUP_ERROR,
			description: 'This is an error',
		} );

		fetchMock.postOnce( activateEndpoint, {
			body: { message: 'Retry failed' },
			status: 500,
		} );

		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh', 'setupFlowRefreshPhase4' ],
			}
		);

		await waitForRegistry();

		fireEvent.click(
			getByRole( 'button', { name: 'Retry Analytics setup' } )
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( activateEndpoint );
		} );
	} );
} );
