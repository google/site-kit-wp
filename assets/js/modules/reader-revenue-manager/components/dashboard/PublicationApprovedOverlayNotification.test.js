/**
 * PublicationApprovedOverlayNotification component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import { act, fireEvent, render } from '../../../../../../tests/js/test-utils';
import PublicationApprovedOverlayNotification, {
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
} from './PublicationApprovedOverlayNotification';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { NOTIFICATIONS } from '../..';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';

describe( 'PublicationApprovedOverlayNotification', () => {
	mockLocation();
	const PublicationApprovedOverlayNotificationComponent =
		withNotificationComponentProps(
			RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION
		)( PublicationApprovedOverlayNotification );

	const notification =
		NOTIFICATIONS[ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION ];

	let registry;

	const dismissItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
				notification
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.postOnce( settingsEndpoint, ( _url, opts ) => {
			const { data } = JSON.parse( opts.body );

			// Return the same settings passed to the API.
			return { body: data, status: 200 };
		} );
	} );

	it( 'should render the component with correct title and description', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: '12345',
			} );

		const { getByText, waitForRegistry } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<PublicationApprovedOverlayNotificationComponent />
			</ViewContextProvider>,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Make sure that title is rendered.
		expect(
			getByText( /Your Reader Revenue Manager publication is approved/ )
		).toBeInTheDocument();

		// Make sure that description is present in the component.
		expect(
			getByText(
				/Unlock your full reader opportunity by enabling features like paywall, subscriptions, contributions and newsletter sign ups/
			)
		).toBeInTheDocument();

		// Make sure that the notificationID is present for the component wrapper.
		expect(
			document.querySelector(
				`#${ RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION }`
			)
		).toBeInTheDocument();
	} );

	it( 'should get dismissed when "Enable features" CTA is clicked', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: '12345',
			} );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.postOnce( dismissItemsEndpoint, {
			body: {
				data: {
					slug: RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
					expiration: 0,
				},
			},
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<PublicationApprovedOverlayNotificationComponent />
			</ViewContextProvider>,
			{
				registry,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Enable features/i } )
			);
		} );

		expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when the onboarding is complete and the onboarding state was just changed', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'ONBOARDING_COMPLETE',
					publicationOnboardingStateChanged: true,
				} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is active when the onboarding is complete and the setup success notification is showing but payment option is empty', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'ONBOARDING_COMPLETE',
					paymentOption: '',
					publicationOnboardingStateChanged: false,
				} );
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_READER_REVENUE_MANAGER }`;

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the RRM module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULES_READER_REVENUE_MANAGER,
					active: false,
					connected: false,
				},
			] );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'ONBOARDING_COMPLETE',
					publicationOnboardingStateChanged: true,
				} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the onboarding is not complete but other settings could trigger the overlay', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'PENDING_VERIFICATION',
					paymentOption: '',
					publicationOnboardingStateChanged: true,
				} );
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_READER_REVENUE_MANAGER }`;

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the publication onboarding state is complete but the paymentOption is valid and the publication state is not changed', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'ONBOARDING_COMPLETE',
					paymentOption: 'validPaymentOption',
					publicationOnboardingStateChanged: false,
				} );
			global.location.href = `http://example.com/wp-admin/admin.php?notification=authentication_success&slug=${ MODULE_SLUG_READER_REVENUE_MANAGER }`;

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the publication onboarding state is complete, the paymentOption is valid but the success notification is not showing', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					publicationID: '12345',
					publicationOnboardingState: 'ONBOARDING_COMPLETE',
					paymentOption: 'validPaymentOption',
					publicationOnboardingStateChanged: false,
				} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
