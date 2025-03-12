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

	it( 'should render an introductory overlay notification when payment option is noPayment', async () => {
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

		// Verify that the component is tracking the view event.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'view_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
	} );

	it( 'should render an introductory overlay notification when payment option is empty', async () => {
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

		// Verify that the component is tracking the view event.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'view_notification',
			`${ ONBOARDING_COMPLETE }:`
		);
	} );

	it( 'should return null when dashboard is not main dashboard', async () => {
		const { container, waitForRegistry } = render(
			<RRMIntroductoryOverlayNotification />,
			{
				registry,
				viewContext: 'other-context',
			}
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();

		// Verify that the component is not tracking the view event.
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should return null when notification is dismissed', async () => {
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

		// Verify that the component is not tracking the view event.
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should get dismissed when "Explore features" CTA is clicked', async () => {
		fetchMock.postOnce( dismissItemsEndpoint, {
			body: {
				data: {
					slug: RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
					expiration: 0,
				},
			},
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

		// Verify that the component is tracking the events.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'view_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'confirm_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
	} );

	it( 'should get dismissed when "Maybe later" button is clicked', async () => {
		fetchMock.postOnce( dismissItemsEndpoint, {
			body: {
				data: {
					slug: RRM_INTRODUCTORY_OVERLAY_NOTIFICATION,
					expiration: 0,
				},
			},
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

		// Verify that the component is tracking the events.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'view_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'dismiss_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
	} );

	it( 'should track "click_learn_more_link" event when clicking learn more link', async () => {
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
			fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );
		} );

		// Verify that the component is tracking the events.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'view_notification',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-introductory-notification`,
			'click_learn_more_link',
			`${ ONBOARDING_COMPLETE }:noPayment`
		);
	} );
} );
