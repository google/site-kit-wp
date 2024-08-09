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
import { createTestRegistry } from '../../../../../../tests/js/utils';
import { act, fireEvent, render } from '../../../../../../tests/js/test-utils';
import PublicationApprovedOverlayNotification, {
	RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
} from './PublicationApprovedOverlayNotification';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';
import * as tracking from '../../../../util/tracking';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'PublicationApprovedOverlayNotification', () => {
	let registry;

	const dismissItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		registry
			.dispatch( CORE_UI )
			.setValue(
				UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
				true
			);
	} );

	it( 'should render the component with correct title and description', async () => {
		// No items are dismissed.
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<PublicationApprovedOverlayNotification />
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
				/Unlock your full reader opportunity by enabling features like subscriptions, contributions and newsletter sign ups/
			)
		).toBeInTheDocument();

		// Make sure that `googlesitekit-reader-revenue-manager-publication-approved-notification` class is present for the component wrapper.
		expect(
			document.querySelector(
				'.googlesitekit-reader-revenue-manager-publication-approved-notification'
			)
		).toBeInTheDocument();

		// Make sure that the component is tracking the view event.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-publication-approved-notification`,
			'view_notification'
		);
	} );

	it( 'should return null when dashboard is not main dashboard', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render(
			<ViewContextProvider
				value={ VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
			>
				<PublicationApprovedOverlayNotification />
			</ViewContextProvider>,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Container should be empty.
		expect( container ).toBeEmptyDOMElement();
		// Component should return null.
		expect( container.firstChild ).toBeNull();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should return null when notification is dismissed', async () => {
		// Set the notification as dismissed.
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [
				RRM_PUBLICATION_APPROVED_OVERLAY_NOTIFICATION,
			] );

		const { container, waitForRegistry } = render(
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<PublicationApprovedOverlayNotification />
			</ViewContextProvider>,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Container should be empty.
		expect( container ).toBeEmptyDOMElement();
		// Component should return null.
		expect( container.firstChild ).toBeNull();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should get dismissed when "Enable features" CTA is clicked', async () => {
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
				<PublicationApprovedOverlayNotification />
			</ViewContextProvider>,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			1,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-publication-approved-notification`,
			'view_notification'
		);

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Enable features/i } )
			);
		} );

		expect( fetchMock ).toHaveFetched( dismissItemsEndpoint );

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			2,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-publication-approved-notification`,
			'confirm_notification'
		);

		expect( mockTrackEvent ).toHaveBeenNthCalledWith(
			3,
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_rrm-publication-approved-notification`,
			'dismiss_notification'
		);
	} );
} );
