/**
 * SearchFunnelWidgetGA4 component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import {
	render,
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	provideUserInfo,
	provideUserAuthentication,
	provideSiteInfo,
	muteFetch,
	fireEvent,
} from '../../../../../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';

function mockUseIntersection() {
	return { intersectionRatio: 0 };
}

jest.mock( 'react-use', () => {
	const actual = jest.requireActual( 'react-use' );
	return {
		...actual,
		useIntersection: ( ...args ) => mockUseIntersection( ...args ),
		__setUseIntersection: ( fn ) => {
			mockUseIntersection = fn;
		},
		useUpdateEffect: ( fn, deps ) =>
			require( 'react' ).useEffect( fn, deps ),
		useMount: ( fn ) => require( 'react' ).useEffect( fn, [] ),
	};
} );

import SearchFunnelWidgetGA4 from '.';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-width-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

describe( 'SearchFunnelWidgetGA4', () => {
	let registry;
	let originalViewport;

	const widgetComponentProps = getWidgetComponentProps( 'searchFunnel' );

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
				coreModulesFixture.filter(
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

	describe( 'GA Event Tracking with SetupFlowRefresh Enabled', () => {
		let mockTrackEvent;
		beforeAll( () => {
			mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
			mockTrackEvent.mockImplementation( () => Promise.resolve() );
		} );

		afterEach( () => {
			jest.resetAllMocks();
		} );

		it( 'should track view event when Activate Analytics CTA is rendered', async () => {
			require( 'react-use' ).__setUseIntersection( () => ( {
				intersectionRatio: 1,
			} ) );

			const { waitForRegistry } = render(
				<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'view_cta',
				'search_funnel'
			);

			require( 'react-use' ).__setUseIntersection( () => ( {
				intersectionRatio: 0,
			} ) );
		} );

		it( 'should track dismiss event when Activate Analytics CTA banner is dismissed', async () => {
			const { getByText, waitForRegistry } = render(
				<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Maybe later/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'dismiss_cta',
				'search_funnel'
			);
		} );

		it( 'should track confirm event when Activate Analytics CTA is clicked', async () => {
			const { getByText, waitForRegistry } = render(
				<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Set up Analytics/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'confirm_cta',
				'search_funnel'
			);
		} );

		it( 'should track clickLearnMore event when Learn more link is clicked in Activate Analytics CTA banner', async () => {
			const { getByText, waitForRegistry } = render(
				<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Learn more/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'click_learn_more_link',
				'search_funnel'
			);
		} );
	} );
} );
