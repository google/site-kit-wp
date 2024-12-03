/**
 * FirstPartyModeSetupBanner component tests.
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

import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import FirstPartyModeSetupBanner from './FirstPartyModeSetupBanner';
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { enabledFeatures } from '../../features';

const FPM_SETUP_BANNER_NOTIFICATION = 'first-party-mode-setup-cta-banner';

describe( 'FirstPartyModeSetupBanner', () => {
	let registry;

	const notification = DEFAULT_NOTIFICATIONS[ FPM_SETUP_BANNER_NOTIFICATION ];

	beforeEach( () => {
		registry = createTestRegistry();

		enabledFeatures.add( 'firstPartyMode' );

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
			{
				slug: 'ads',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
			isEnabled: false,
			isFPMHealthy: true,
			isScriptAccessEnabled: true,
		} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				FPM_SETUP_BANNER_NOTIFICATION,
				notification
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when FPM is enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				isEnabled: true,
				isFPMHealthy: true,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when FPM is not healthy', async () => {
			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				isEnabled: false,
				isFPMHealthy: false,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when script access is not enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				isEnabled: false,
				isFPMHealthy: true,
				isScriptAccessEnabled: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );

	describe( 'Rendering', () => {
		let FPMBannerComponent;

		beforeAll( () => {
			enabledFeatures.add( 'firstPartyMode' );

			FPMBannerComponent = withNotificationComponentProps(
				FPM_SETUP_BANNER_NOTIFICATION
			)( FirstPartyModeSetupBanner );
		} );

		it( 'should render the banner', async () => {
			const { getByRole, getByText, waitForRegistry } = render(
				<FPMBannerComponent />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect(
				getByText(
					'Get more comprehensive stats by collecting metrics via your own site'
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: 'Enable First-party mode' } )
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: 'Maybe later' } )
			).toBeInTheDocument();
		} );

		it( 'should not render the banner if dismissed', () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [ FPM_SETUP_BANNER_NOTIFICATION ] );

			const { container } = render( <FPMBannerComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		describe( 'onCTAClick', () => {
			const FPMSettingsEndpoint = new RegExp(
				'^/google-site-kit/v1/core/site/data/fpm-settings'
			);

			const dismissItemEndpoint = new RegExp(
				'^/google-site-kit/v1/core/user/data/dismiss-item'
			);

			it( 'should call onCTAClick when the CTA button is clicked', async () => {
				fetchMock.postOnce( FPMSettingsEndpoint, {
					body: JSON.stringify( {
						isEnabled: true,
						isFPMHealthy: true,
						isScriptAccessEnabled: true,
					} ),
					status: 200,
				} );

				const { getByRole, waitForRegistry } = render(
					<FPMBannerComponent />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				expect(
					registry.select( CORE_SITE ).getFirstPartyModeSettings()
						.isEnabled
				).toBe( false );

				fetchMock.post( dismissItemEndpoint, {
					body: JSON.stringify( [ FPM_SETUP_BANNER_NOTIFICATION ] ),
					status: 200,
				} );

				fireEvent.click(
					getByRole( 'button', {
						name: 'Enable First-party mode',
					} )
				);

				await waitFor( () => {
					expect(
						registry.select( CORE_SITE ).getFirstPartyModeSettings()
							.isEnabled
					).toBe( true );

					expect( fetchMock ).toHaveFetched( FPMSettingsEndpoint );
					expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
				} );
			} );
		} );
	} );
} );
