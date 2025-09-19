/**
 * GoogleTagGatewayOptOutNotice component tests.
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	render,
	fireEvent,
	waitFor,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { GTG_AUTO_ENABLE_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';
import * as tracking from '@/js/util/tracking';
import GoogleTagGatewayOptOutNotice, {
	GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY,
} from './GoogleTagGatewayOptOutNotice';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'GoogleTagGatewayOptOutNotice', () => {
	let registry;

	const gtgSettings = {
		isEnabled: false,
		isGTGHealthy: true,
		isScriptAccessEnabled: true,
		isGTGDefault: true,
	};

	beforeEach( () => {
		mockTrackEvent.mockClear();
		mockUseIntersection.mockClear();

		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();

		provideUserInfo( registry );
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
				connected: false,
			},
			{
				slug: MODULE_SLUG_TAGMANAGER,
				active: true,
				connected: false,
			},
		] );

		registry
			.dispatch( CORE_SITE )
			.receiveGetGoogleTagGatewaySettings( gtgSettings );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'visibility conditions', () => {
		it( 'should render when all conditions are met', () => {
			const { container, getByText } = render(
				<GoogleTagGatewayOptOutNotice />,
				{
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			expect(
				getByText(
					/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
				)
			).toBeInTheDocument();
		} );

		it( 'should not render when no GTG modules are connected', () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: false,
				},
				{
					slug: MODULE_SLUG_ADS,
					active: true,
					connected: false,
				},
				{
					slug: MODULE_SLUG_TAGMANAGER,
					active: true,
					connected: false,
				},
			] );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should not render when GTG is already enabled', () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isEnabled: true,
			} );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should not render when isGTGDefault is false', () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isGTGDefault: false,
			} );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should not render when notice is already dismissed', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					GTG_OPT_OUT_NOTICE_DISMISSED_ITEM_KEY,
				] );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should not render when GTG is not healthy', () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isGTGHealthy: false,
			} );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should not render when script access is not enabled', () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isScriptAccessEnabled: false,
			} );

			const { container } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	it( 'should render with correct description and "Opt out" CTA', () => {
		const { getByText, getByRole } = render(
			<GoogleTagGatewayOptOutNotice />,
			{
				registry,
			}
		);

		expect(
			getByText(
				/Starting in October 2025, Google tag gateway for advertisers will gradually be enabled/
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Opt out' } )
		).toBeInTheDocument();
	} );

	describe( 'interactions', () => {
		it( 'should track view event when component comes into view', () => {
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 0.5,
			} ) );

			render( <GoogleTagGatewayOptOutNotice />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'settings_gtg-opt-out-notice',
				'view_notice'
			);
		} );

		it( 'should track event, set isGTGDefault to false, and dismiss notice when "Opt out" button is clicked', async () => {
			const notification =
				DEFAULT_NOTIFICATIONS[ GTG_AUTO_ENABLE_NOTIFICATION ];

			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					GTG_AUTO_ENABLE_NOTIFICATION,
					notification
				);

			const { getByRole } = render( <GoogleTagGatewayOptOutNotice />, {
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			} );

			const optOutButton = getByRole( 'button', { name: 'Opt out' } );
			fireEvent.click( optOutButton );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					'settings_gtg-opt-out-notice',
					'click_opt_out'
				);
			} );

			// Verify isGTGDefault is set to false.
			expect( registry.select( CORE_SITE ).isGTGDefault() ).toBe( false );
		} );
	} );
} );
