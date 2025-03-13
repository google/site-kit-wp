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
import * as tracking from '../../../../util/tracking';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import RRMIntroductoryOverlayNotification, {
	RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from './RRMIntroductoryOverlayNotification';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'RRMIntroductoryOverlayNotification', () => {
	let registry;

	const dismissItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	const { ONBOARDING_COMPLETE } = PUBLICATION_ONBOARDING_STATES;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: READER_REVENUE_MANAGER_MODULE_SLUG,
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

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should render an introductory overlay notification when the payment option is "noPayment"', async () => {
		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotification />,
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
			<RRMIntroductoryOverlayNotification />,
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

	it( 'should return null when the dashboard is not a main dashboard', async () => {
		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotification />,
			{
				registry,
				viewContext: 'other-context',
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should return null when the notification is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
			] );

		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotification />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should dismiss the notification when the "Explore features" CTA is clicked', async () => {
		fetchMock.postOnce( dismissItemsEndpoint, {
			body: [ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotification />,
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
			<RRMIntroductoryOverlayNotification />,
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

	describe( 'with GA event tracking', () => {
		it( 'should track an event when the notification is viewed when the payment option is "noPayment"', async () => {
			const { waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
				'view_notification',
				`${ ONBOARDING_COMPLETE }:noPayment`
			);
		} );

		it( 'should track an event when the notification is viewed when the payment option is empty', async () => {
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setPaymentOption( '' );

			const { waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
				'view_notification',
				`${ ONBOARDING_COMPLETE }:`
			);
		} );

		it( 'should not track an event when the dashboard is not a main dashboard', async () => {
			const { container, waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: 'other-context',
				}
			);

			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		} );

		it( 'should not track an event when the notification is dismissed', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
				] );

			const { container, waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();

			expect( mockTrackEvent ).not.toHaveBeenCalled();
		} );

		it( 'should track a confirm event when clicking the "Explore features" CTA', async () => {
			fetchMock.postOnce( dismissItemsEndpoint, {
				body: [ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ],
				status: 200,
			} );

			const { getByRole, waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			// The component will track an event when the notification is viewed.
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Explore features/i } )
				);
			} );

			waitFor( () => {
				expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			// Verify that the component is tracking the confirm event.
			expect( mockTrackEvent ).toHaveBeenLastCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
				'confirm_notification',
				`${ ONBOARDING_COMPLETE }:noPayment`
			);
		} );

		it( 'should track a dismiss event when clicking the "Maybe later" button', async () => {
			fetchMock.postOnce( dismissItemsEndpoint, {
				body: [ RRM_INTRODUCTORY_OVERLAY_NOTIFICATION ],
				status: 200,
			} );

			const { getByRole, waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			// The component will track an event when the notification is viewed.
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			waitFor( () => {
				expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			// Verify that the component is tracking the dismiss event.
			expect( mockTrackEvent ).toHaveBeenLastCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
				'dismiss_notification',
				`${ ONBOARDING_COMPLETE }:noPayment`
			);
		} );

		it( 'should track a click event when clicking the "Learn more" link', async () => {
			const { getByRole, waitForRegistry } = render(
				<RRMIntroductoryOverlayNotification />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			// The component will track an event when the notification is viewed.
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			// Verify that the component is tracking the click event.
			expect( mockTrackEvent ).toHaveBeenLastCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
				'click_learn_more_link',
				`${ ONBOARDING_COMPLETE }:noPayment`
			);
		} );
	} );
} );
