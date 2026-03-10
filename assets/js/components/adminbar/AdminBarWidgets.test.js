/**
 * AdminBarWidgets component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

import { useIntersection as mockUseIntersection } from 'react-use';

import {
	render,
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	muteFetch,
	provideUserAuthentication,
	fireEvent,
} from '../../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import AdminBarWidgets from './AdminBarWidgets';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AdminBarWidgets', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetAuthentication( {
			authenticated: true,
			needsReauthentication: false,
		} );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{
				body: [
					{
						clicks: 123,
						ctr: 8.91,
						impressions: 4567,
						position: 23.456,
					},
				],
			}
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should render the Admin Bar Widgets, including the Activate Analytics CTA', async () => {
		const { container, getByText, waitForRegistry } = render(
			<AdminBarWidgets />,
			{
				registry,
			}
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
			<AdminBarWidgets />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Set up Google Analytics/ )
		).not.toBeInTheDocument();
	} );

	it( 'should render the Admin Bar Widgets for the view only user if the module is shared', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			'googlesitekit_read_shared_module_data::["search-console"]': true,
		} );

		const { getByText, queryByText, waitForRegistry } = render(
			<AdminBarWidgets />,
			{
				registry,
				viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
			}
		);

		await waitForRegistry();

		// Verify that the Search Console widgets are rendered.
		expect( getByText( /total impressions/i ) ).toBeInTheDocument();
		expect( getByText( /total clicks/i ) ).toBeInTheDocument();

		// Verify that the Analytics widgets are not rendered.
		expect( queryByText( /total users/i ) ).not.toBeInTheDocument();
		expect( queryByText( /total sessions/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the Admin Bar Widgets for the view only user if the module is not shared', async () => {
		provideUserAuthentication( registry, { authenticated: false } );

		const { queryByText, waitForRegistry } = render( <AdminBarWidgets />, {
			registry,
			viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
		} );

		await waitForRegistry();

		expect( queryByText( /total impressions/i ) ).not.toBeInTheDocument();
	} );

	describe( 'GA Event Tracking with SetupFlowRefresh Enabled', () => {
		beforeEach( () => {
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );
		} );

		it( 'should track view event when Activate Analytics CTA is rendered', async () => {
			const { waitForRegistry } = render( <AdminBarWidgets />, {
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'view_cta',
				'admin_bar'
			);
		} );

		it( 'should track dismiss event when Activate Analytics CTA banner is dismissed', async () => {
			const { getByText, waitForRegistry } = render(
				<AdminBarWidgets />,
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
				'admin_bar'
			);
		} );

		it( 'should track confirm event when Activate Analytics CTA is clicked', async () => {
			const { getByText, waitForRegistry } = render(
				<AdminBarWidgets />,
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
				'admin_bar'
			);
		} );

		it( 'should track clickLearnMore event when Learn more link is clicked in Activate Analytics CTA banner', async () => {
			const { getByText, waitForRegistry } = render(
				<AdminBarWidgets />,
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
				'admin_bar'
			);
		} );
	} );
} );
