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
	createTestRegistry,
	provideModules,
} from '../../../../../../tests/js/utils';
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import * as tracking from '../../../../util/tracking';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import RRMIntroductoryOverlayNotification, {
	RRM_MONETIZATION_OVERLAY_NOTIFICATION,
} from './RRMIntroductoryOverlayNotification';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'RRMIntroductoryOverlayNotification', () => {
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

		fetchMock.postOnce( settingsEndpoint, ( _url, opts ) => {
			const { data } = JSON.parse( opts.body );

			// Return the same settings passed to the API.
			return { body: data, status: 200 };
		} );
	} );

	afterEach( () => {
		fetchMock.reset();
	} );

	it( 'should render an introductory overlay notification when payment option is noPayment', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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

	it( 'should render an introductory overlay notification when payment option is empty', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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

	it( 'should return null when dashboard is not main dashboard', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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

	it( 'should return null when notification is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				RRM_MONETIZATION_OVERLAY_NOTIFICATION,
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

	it( 'should get dismissed when "Explore features" CTA is clicked', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.postOnce( dismissItemsEndpoint, {
			body: {
				data: {
					slug: RRM_MONETIZATION_OVERLAY_NOTIFICATION,
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

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-monetization-notification`,
			'view_notification'
		);

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Explore features/i } )
			);
		} );

		waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );

			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-monetization-notification`,
				'confirm_notification'
			);
		} );
	} );
} );
