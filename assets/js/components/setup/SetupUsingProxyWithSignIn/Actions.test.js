/**
 * Actions component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { act, fireEvent, render } from '../../../../../tests/js/test-utils';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideTracking,
	provideUserCapabilities,
	provideUserInfo,
} from '../../../../../tests/js/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as tracking from '@/js/util/tracking';
import Actions from './Actions';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from '@/js/components/setup/constants';
import { VIEW_CONTEXT_SPLASH } from '@/js/googlesitekit/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'Actions', () => {
	mockLocation();

	let registry;

	const actionsProps = {
		proxySetupURL: 'https://example.com/test-proxy-setup',
		onButtonClick: jest.fn(),
		complete: true,
		inProgressFeedback: 'Test in progress feedback',
		ctaFeedback: 'Test CTA feedback',
	};

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserCapabilities( registry );
		provideTracking( registry, false );
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should render correctly', () => {
		provideModules( registry );
		provideSiteConnection( registry );

		const { container, getByRole } = render(
			<Actions { ...actionsProps } />,
			{
				viewContext: VIEW_CONTEXT_SPLASH,
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', { name: 'Sign in with Google' } )
		).toBeInTheDocument();
	} );

	it( 'should invoke the onButtonClick callback when the button is clicked', async () => {
		provideModules( registry );
		provideSiteConnection( registry );

		const { getByRole, waitForRegistry } = render(
			<Actions { ...actionsProps } />,
			{
				viewContext: VIEW_CONTEXT_SPLASH,
				registry,
			}
		);

		fireEvent.click(
			getByRole( 'button', { name: 'Sign in with Google' } )
		);

		expect( actionsProps.onButtonClick ).toHaveBeenCalled();

		await waitForRegistry();
	} );

	it( 'should render the reset button when the site is resettable', () => {
		provideModules( registry );
		provideSiteConnection( registry, {
			hasConnectedAdmins: false,
			resettable: true,
		} );

		const { container, getByRole } = render(
			<Actions { ...actionsProps } />,
			{
				viewContext: VIEW_CONTEXT_SPLASH,
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByRole( 'button', { name: 'Reset Site Kit' } )
		).toBeInTheDocument();
	} );

	it( 'should track an event when the user opts in', async () => {
		jest.useFakeTimers();

		provideModules( registry );
		provideSiteConnection( registry );
		provideTracking( registry, false );

		fetchMock.post(
			new RegExp( '^/google-site-kit/v1/core/user/data/tracking' ),
			{
				status: 200,
				body: { enabled: true },
			}
		);

		const { getByRole } = render( <Actions { ...actionsProps } />, {
			viewContext: VIEW_CONTEXT_SPLASH,
			registry,
		} );

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			VIEW_CONTEXT_SPLASH,
			'tracking_optin'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should track an event when the user opts in with setupFlowRefresh enabled', async () => {
		jest.useFakeTimers();

		provideModules( registry );
		provideSiteConnection( registry );
		provideTracking( registry, false );

		fetchMock.post(
			new RegExp( '^/google-site-kit/v1/core/user/data/tracking' ),
			{
				status: 200,
				body: { enabled: true },
			}
		);

		const { getByRole } = render( <Actions { ...actionsProps } />, {
			viewContext: VIEW_CONTEXT_SPLASH,
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		fireEvent.click( getByRole( 'checkbox' ) );

		// Wait for the debounced handler to complete, and advance to the next tick.
		await act( () => {
			jest.advanceTimersByTime( 300 );
			return Promise.resolve();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			VIEW_CONTEXT_SPLASH,
			'setup_flow_v3_tracking_optin'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'view-only button', () => {
		const dismissItemEndpoint = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);

		beforeEach( () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
					shareable: true,
				},
			] );
			provideSiteConnection( registry, {
				hasMultipleAdmins: true,
			} );

			registry.dispatch( CORE_USER ).receiveGetCapabilities( {
				'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			} );

			fetchMock.post( dismissItemEndpoint, {
				body: JSON.stringify( [ SHARED_DASHBOARD_SPLASH_ITEM_KEY ] ),
				status: 200,
			} );
		} );

		it( 'should render the button for a second admin when shared modules are available', () => {
			const { container, getByRole } = render(
				<Actions { ...actionsProps } />,
				{
					viewContext: VIEW_CONTEXT_SPLASH,
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			expect(
				getByRole( 'button', {
					name: 'Skip sign-in and view limited dashboard',
				} )
			).toBeInTheDocument();
		} );

		it( 'should navigate to the dashboard when the button is clicked', async () => {
			const { getByRole, waitForRegistry } = render(
				<Actions { ...actionsProps } />,
				{
					viewContext: VIEW_CONTEXT_SPLASH,
					registry,
				}
			);

			expect( global.location.assign ).toHaveBeenCalledTimes( 0 );

			fireEvent.click(
				getByRole( 'button', {
					name: 'Skip sign-in and view limited dashboard',
				} )
			);

			await waitForRegistry();

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard'
			);
			expect( global.location.assign ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should dismiss the shared dashboard splash item when the button is clicked', async () => {
			const { getByRole, waitForRegistry } = render(
				<Actions { ...actionsProps } />,
				{
					viewContext: VIEW_CONTEXT_SPLASH,
					registry,
				}
			);

			expect(
				registry.select( CORE_USER ).getDismissedItems()
			).toBeUndefined();
			expect( fetchMock ).toHaveFetchedTimes( 0 );

			fireEvent.click(
				getByRole( 'button', {
					name: 'Skip sign-in and view limited dashboard',
				} )
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: SHARED_DASHBOARD_SPLASH_ITEM_KEY,
						expiration: 0,
					},
				},
			} );

			expect( registry.select( CORE_USER ).getDismissedItems() ).toEqual(
				[ SHARED_DASHBOARD_SPLASH_ITEM_KEY ]
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		it( 'should track an event when the button is clicked', async () => {
			const { getByRole, waitForRegistry } = render(
				<Actions { ...actionsProps } />,
				{
					viewContext: VIEW_CONTEXT_SPLASH,
					registry,
				}
			);

			expect( global.location.assign ).toHaveBeenCalledTimes( 0 );

			fireEvent.click(
				getByRole( 'button', {
					name: 'Skip sign-in and view limited dashboard',
				} )
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				VIEW_CONTEXT_SPLASH,
				'skip_setup_to_viewonly'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should track an event when the button is clicked and setupFlowRefresh is enabled', () => {
			const { getByRole } = render( <Actions { ...actionsProps } />, {
				viewContext: VIEW_CONTEXT_SPLASH,
				registry,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click(
				getByRole( 'button', {
					name: 'Skip sign-in and view limited dashboard',
				} )
			);

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				VIEW_CONTEXT_SPLASH,
				'setup_flow_v3_skip_to_viewonly'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
