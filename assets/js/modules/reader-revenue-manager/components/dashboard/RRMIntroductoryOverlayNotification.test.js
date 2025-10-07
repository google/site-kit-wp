/**
 * RRMIntroductoryOverlayNotification component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import RRMIntroductoryOverlayNotification, {
	RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from './RRMIntroductoryOverlayNotification';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { NOTIFICATIONS } from '@/js/modules/reader-revenue-manager';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';

describe( 'RRMIntroductoryOverlayNotification', () => {
	const RRMIntroductoryOverlayNotificationComponent =
		withNotificationComponentProps( RRM_INTRODUCTORY_OVERLAY_NOTIFICATION )(
			RRMIntroductoryOverlayNotification
		);

	const notification = NOTIFICATIONS[ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ];

	let registry;

	const dismissItemsEndpoint = new RegExp(
		'/google-site-kit/v1/core/user/data/dismiss-item'
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
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationOnboardingState: 'ONBOARDING_COMPLETE',
				publicationID: '123',
				paymentOption: 'noPayment',
			} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
				notification
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when the payment option is "noPayment"', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is active when the payment option is empty', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPaymentOption( '' );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );
	} );

	it( 'should render an introductory overlay notification when the payment option is "noPayment"', async () => {
		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'New! Monetize your content with Reader Revenue Manager'
		);
	} );

	it( 'should render an introductory overlay notification when the payment option is empty', async () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( '' );

		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Complete account setup with Reader Revenue Manager'
		);
	} );

	it( 'should dismiss the notification when the "Explore features" CTA is clicked', async () => {
		fetchMock.postOnce( dismissItemsEndpoint, {
			body: [ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Explore features/i } )
			);
		} );

		waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );
		} );
	} );

	it( 'should dismiss the notification when the "Maybe later" button is clicked', async () => {
		fetchMock.postOnce( dismissItemsEndpoint, {
			body: [ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );
		} );

		waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );
		} );
	} );
} );
