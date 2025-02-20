/**
 * AccountLinkedViaGoogleForWooCommerceSubtleNotification.test tests.
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
import { ADS_NOTIFICATIONS } from '../..';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import { fireEvent, render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '../../../../../../tests/js/utils';
import { enabledFeatures } from '../../../../features';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import AccountLinkedViaGoogleForWooCommerceSubtleNotification from './AccountLinkedViaGoogleForWooCommerceSubtleNotification';

const NOTIFICATION_ID = 'account-linked-via-google-for-woocommerce';

describe( 'AccountLinkedViaGoogleForWooCommerceSubtleNotification.test', () => {
	mockLocation();

	let registry;

	const dismissItemEndpoint = RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const notification = ADS_NOTIFICATIONS[ NOTIFICATION_ID ];

	const AccountLinkedViaGoogleForWooCommerceSubtleNotificationComponent =
		withNotificationComponentProps( NOTIFICATION_ID )(
			AccountLinkedViaGoogleForWooCommerceSubtleNotification
		);

	beforeEach( () => {
		registry = createTestRegistry();

		enabledFeatures.add( 'adsPax' );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( NOTIFICATION_ID, notification );

		provideSiteInfo( registry );
	} );

	it( 'should start Ads module setup when tertiary CTA is clicked', async () => {
		provideSiteInfo( registry );
		provideModuleRegistrations( registry );
		provideModules( registry );
		provideUserCapabilities( registry );

		fetchMock.postOnce(
			RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
			{
				body: { success: true },
			}
		);
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				body: { needsReauthentication: false },
			}
		);
		fetchMock.postOnce( dismissItemEndpoint, {
			body: JSON.stringify( [ NOTIFICATION_ID ] ),
		} );

		const { getByText, waitForRegistry } = render(
			<AccountLinkedViaGoogleForWooCommerceSubtleNotificationComponent />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click( getByText( 'Create new account' ) );

		await waitForRegistry();

		expect(
			registry.select( CORE_MODULES ).isDoingSetModuleActivation( 'ads' )
		).toBe( true );

		// Modal should be dismissed.
		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
	} );

	it( 'should dismiss subtle notification when primary CTA is clicked', async () => {
		provideModules( registry );
		provideUserCapabilities( registry );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: JSON.stringify( [ NOTIFICATION_ID ] ),
		} );

		const { getByText, waitForRegistry } = render(
			<AccountLinkedViaGoogleForWooCommerceSubtleNotificationComponent />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		fireEvent.click( getByText( 'Keep existing account' ) );

		await waitForRegistry();

		// Modal should be dismissed.
		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
	} );

	describe( 'checkRequirements', () => {
		it( 'should return false if the WooCommerce or Google for WooCommerce plugins are not activated', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'should return true if the WooCommerce and Google for WooCommerce plugins are active and Ads account ins linked', async () => {
			provideSiteInfo( registry, {
				plugins: {
					wooCommerce: {
						active: true,
					},
					googleForWooCommerce: {
						active: true,
						adsConnected: true,
					},
				},
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );
	} );
} );
