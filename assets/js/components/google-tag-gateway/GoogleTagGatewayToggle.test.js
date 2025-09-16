/**
 * Google Tag Gateway Toggle component tests.
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

/**
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	muteFetch,
	freezeFetch,
	act,
	waitForDefaultTimeouts,
	provideSiteInfo,
	provideModules,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SETTINGS,
} from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import GoogleTagGatewayToggle from './GoogleTagGatewayToggle';
import { GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY } from '@/js/components/google-tag-gateway/GoogleTagGatewayOptOutNotice';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';
import { GTG_AUTO_ENABLE_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'GoogleTagGatewayToggle', () => {
	let registry;

	const serverRequirementStatusEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
	);
	const dismissedItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);

	beforeEach( () => {
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ADS,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_TAGMANAGER,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
			isEnabled: false,
			isGTGHealthy: null,
			isScriptAccessEnabled: null,
			isGTGDefault: true,
		} );

		// Mock dismissed items to prevent opt-out notice from showing by default.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY,
				GTG_AUTO_ENABLE_NOTIFICATION,
			] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should make a request to fetch the server requirement status', async () => {
		muteFetch( serverRequirementStatusEndpoint );

		const { waitForRegistry } = render( <GoogleTagGatewayToggle />, {
			registry,
		} );

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( serverRequirementStatusEndpoint );
	} );

	it( 'should render in loading state if the server requirement status is still loading', async () => {
		freezeFetch( serverRequirementStatusEndpoint );

		const { container, getByRole, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render in default state', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { container, getByLabelText, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByLabelText( 'Google tag gateway for advertisers' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render in disabled state if server requirements are not met', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: false,
				isScriptAccessEnabled: false,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { container, getByLabelText, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByLabelText( 'Google tag gateway for advertisers' )
		).toBeDisabled();

		expect( container ).toHaveTextContent(
			'Your server’s current settings prevent Google tag gateway for advertisers from working. To enable it, please contact your hosting provider and request access to external resources and plugin files.'
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should not track an event when the toggle is viewed with no warning notice', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByLabelText, queryByText, rerender, waitForRegistry } =
			render( <GoogleTagGatewayToggle />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

		await waitForRegistry();

		expect(
			getByLabelText( 'Google tag gateway for advertisers' )
		).toBeInTheDocument();

		expect(
			queryByText(
				'Your server’s current settings prevent Google tag gateway for advertisers from working. To enable it, please contact your hosting provider and request access to external resources and plugin files.'
			)
		).not.toBeInTheDocument();

		// Simulate the warning notice becoming visible if it were present.
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: true,
			intersectionRatio: 1,
		} ) );

		rerender( <GoogleTagGatewayToggle /> );

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should track an event when the warning notice is viewed', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: false,
				isScriptAccessEnabled: false,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByLabelText, getByText, rerender, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			getByLabelText( 'Google tag gateway for advertisers' )
		).toBeInTheDocument();

		expect(
			getByText(
				'Your server’s current settings prevent Google tag gateway for advertisers from working. To enable it, please contact your hosting provider and request access to external resources and plugin files.'
			)
		).toBeInTheDocument();

		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: true,
			intersectionRatio: 1,
		} ) );

		// Simulate the warning notice becoming visible.
		rerender( <GoogleTagGatewayToggle /> );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-settings-toggle-disabled',
			'view_notice'
		);
	} );

	it( 'should track an event when the `Learn more` link is clicked in the toggle description', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		const learnMoreLink = getByRole( 'link', {
			name: 'Learn more about Google tag gateway for advertisers (opens in a new tab)',
		} );

		learnMoreLink.click();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-settings-toggle',
			'click_learn_more_link'
		);
	} );

	it( 'should track an event when the `Learn more` link is clicked in the warning notice', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: false,
				isScriptAccessEnabled: false,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		const learnMoreLink = getByRole( 'link', {
			name: 'Learn more about Google tag gateway for advertisers server requirements (opens in a new tab)',
		} );

		learnMoreLink.click();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-settings-toggle-disabled',
			'click_learn_more_link'
		);
	} );

	it.each( [ 'isGTGHealthy', 'isScriptAccessEnabled' ] )(
		'should not render in disabled state unless %s is explicitly false',
		async ( requirement ) => {
			const response = {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			};

			response[ requirement ] = null;

			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: response,
				status: 200,
			} );

			const { getByLabelText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByLabelText( 'Google tag gateway for advertisers' )
			).not.toBeDisabled();
		}
	);

	it.each( [ 'isGTGHealthy', 'isScriptAccessEnabled' ] )(
		'should render in disabled state if %s is false',
		async ( requirement ) => {
			const response = {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			};

			response[ requirement ] = false;

			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: response,
				status: 200,
			} );

			const { getByLabelText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByLabelText( 'Google tag gateway for advertisers' )
			).toBeDisabled();
		}
	);

	it( 'should toggle Google tag gateway for advertisers on click', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByLabelText, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const switchControl = getByLabelText(
			'Google tag gateway for advertisers'
		);

		expect( switchControl ).not.toBeChecked();

		expect( registry.select( CORE_SITE ).isGoogleTagGatewayEnabled() ).toBe(
			false
		);

		switchControl.click();

		// Allow the `trackEvent()` promise to resolve.
		await act( waitForDefaultTimeouts );

		expect( switchControl ).toBeChecked();

		expect( registry.select( CORE_SITE ).isGoogleTagGatewayEnabled() ).toBe(
			true
		);

		// Give it another click to verify it can be toggled off.
		switchControl.click();

		// Allow the `trackEvent()` promise to resolve.
		await act( waitForDefaultTimeouts );

		expect( switchControl ).not.toBeChecked();

		expect( registry.select( CORE_SITE ).isGoogleTagGatewayEnabled() ).toBe(
			false
		);
	} );

	it( 'should track an event when the toggle is clicked', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { getByLabelText, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		const switchControl = getByLabelText(
			'Google tag gateway for advertisers'
		);

		switchControl.click();

		// Allow the `trackEvent()` promise to resolve.
		await act( waitForDefaultTimeouts );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-settings-toggle',
			'activate_google_tag_gateway'
		);

		switchControl.click();

		// Allow the `trackEvent()` promise to resolve.
		await act( waitForDefaultTimeouts );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-settings-toggle',
			'deactivate_google_tag_gateway'
		);
	} );

	it( 'should render a "Beta" badge', async () => {
		fetchMock.getOnce( serverRequirementStatusEndpoint, {
			body: {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			},
			status: 200,
		} );

		const { container, waitForRegistry } = render(
			<GoogleTagGatewayToggle />,
			{
				registry,
			}
		);

		await waitForRegistry();

		const badgeElement = container.querySelector( '.googlesitekit-badge' );

		expect( badgeElement ).toBeInTheDocument();
		expect( badgeElement ).toHaveTextContent( 'Beta' );
	} );

	describe( 'Opt-out notice integration', () => {
		it( 'should not show the opt-out notice when it has been dismissed', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: false,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: true,
				},
				status: 200,
			} );

			const { queryByText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// Opt-out notice should not be visible when dismissed.
			expect(
				queryByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).not.toBeInTheDocument();
		} );

		it( 'should show the opt-out notice when conditions are met', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: false,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: true,
				},
				status: 200,
			} );

			// Clear dismissed items to allow notice to show.
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			// Update GTG settings to have health status true (not null).
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			} );

			// Mock the dismissed items endpoint with empty array.
			fetchMock.getOnce(
				dismissedItemsEndpoint,
				{
					body: [],
					status: 200,
				},
				{ overwriteRoutes: true }
			);

			const { getByText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// Opt-out notice should be visible.
			expect(
				getByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).toBeInTheDocument();

			// Should have "Opt out" button.
			expect( getByText( 'Opt out' ) ).toBeInTheDocument();
		} );

		it( 'should not show the opt-out notice when GTG is already enabled', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: true,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: true,
				},
				status: 200,
			} );

			// Clear dismissed items to allow notice to show if conditions were met.
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			// Update settings to have GTG enabled.
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			} );

			const { queryByText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// Opt-out notice should not be visible when GTG is already enabled.
			expect(
				queryByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).not.toBeInTheDocument();
		} );

		it( 'should not show the opt-out notice when isGTGDefault is false', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: false,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: false,
				},
				status: 200,
			} );

			// Clear dismissed items to allow notice to show if conditions were met.
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			// Update settings to have isGTGDefault as false (user has interacted).
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: false,
			} );

			const { queryByText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// Opt-out notice should not be visible when user has already interacted.
			expect(
				queryByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).not.toBeInTheDocument();
		} );

		it( 'should track an event when the opt-out notice is viewed', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: false,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: true,
				},
				status: 200,
			} );

			// Clear dismissed items to allow notice to show.
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			// Update GTG settings to have health status true (not null).
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			} );

			const { getByText, rerender, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			// Verify notice is present.
			expect(
				getByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).toBeInTheDocument();

			// Simulate notice becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <GoogleTagGatewayToggle /> );

			// Should track view event.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'settings_gtg-opt-out-notice',
				'view_notice'
			);
		} );

		it( 'should handle "Opt out" button click and update isGTGDefault', async () => {
			fetchMock.getOnce( serverRequirementStatusEndpoint, {
				body: {
					isEnabled: false,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
					isGTGDefault: true,
				},
				status: 200,
			} );

			// Clear dismissed items to allow notice to show.
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			const notification =
				DEFAULT_NOTIFICATIONS[ GTG_AUTO_ENABLE_NOTIFICATION ];

			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					GTG_AUTO_ENABLE_NOTIFICATION,
					notification
				);

			// Update GTG settings to have health status true (not null).
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
				isGTGDefault: true,
			} );

			const { getByText, queryByText, waitForRegistry } = render(
				<GoogleTagGatewayToggle />,
				{
					registry,
					viewContext: VIEW_CONTEXT_SETTINGS,
				}
			);

			await waitForRegistry();

			// Verify notice is present.
			expect(
				getByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).toBeInTheDocument();

			// Verify initial state.
			expect( registry.select( CORE_SITE ).isGTGDefault() ).toBe( true );

			const optOutButton = getByText( 'Opt out' );

			optOutButton.click();

			// Should track opt out event.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'settings_gtg-opt-out-notice',
				'click_opt_out'
			);

			// Should update isGTGDefault to false.
			expect( registry.select( CORE_SITE ).isGTGDefault() ).toBe( false );

			// Notice should be dismissed (no longer visible).
			await waitForRegistry();
			expect(
				queryByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).not.toBeInTheDocument();
		} );
	} );
} );
