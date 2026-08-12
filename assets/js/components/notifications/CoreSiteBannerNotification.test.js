/**
 * CoreSiteBannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { NOTIFICATION_AREAS } from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { HOUR_IN_SECONDS } from '@/js/util';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { dismissItemEndpoint } from '@tests/js/mock-dismiss-item-endpoints';
import {
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import CoreSiteBannerNotification from './CoreSiteBannerNotification';

describe( 'CoreSiteBannerNotification', () => {
	mockLocation();

	let registry;
	let windowOpenMock;

	const markNotificationsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/mark-notification'
	);

	const defaultProps = {
		id: 'test-notification',
		title: 'Test notification',
		ctaLabel: 'Go to page',
		ctaURL: 'https://example.com/page',
	};

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( defaultProps.id, {
				Component: () => null,
				areaSlug: NOTIFICATION_AREAS.HEADER,
				isDismissible: true,
			} );

		windowOpenMock = jest.fn();
		global.open = windowOpenMock;
	} );

	it( 'marks the notification as accepted and dismisses it before navigating to the CTA URL', async () => {
		let resolveMarkNotification;
		const markNotificationPromise = new Promise( ( resolve ) => {
			resolveMarkNotification = resolve;
		} );

		fetchMock.postOnce( markNotificationsEndpoint, () => {
			return markNotificationPromise;
		} );
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ defaultProps.id ],
		} );

		const { getByRole } = render(
			<CoreSiteBannerNotification { ...defaultProps } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to page' } ) );

		expect( global.location.assign ).not.toHaveBeenCalled();
		expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );

		await waitFor( () => {
			expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
		} );

		resolveMarkNotification( { body: 'true', status: 200 } );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( markNotificationsEndpoint, {
				body: {
					data: {
						notificationID: 'test-notification',
						notificationState: 'accepted',
					},
				},
			} );
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: 'test-notification',
						expiration: HOUR_IN_SECONDS,
					},
				},
			} );
			expect( global.location.assign ).toHaveBeenCalledWith(
				'https://example.com/page'
			);
		} );
	} );

	it( 'opens the CTA URL in a new tab when ctaTarget is _blank', async () => {
		fetchMock.postOnce( markNotificationsEndpoint, {
			body: 'true',
			status: 200,
		} );
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ defaultProps.id ],
		} );

		const { getByRole } = render(
			<CoreSiteBannerNotification
				{ ...defaultProps }
				ctaTarget="_blank"
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: /Go to page/ } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
				body: {
					data: {
						slug: 'test-notification',
						expiration: HOUR_IN_SECONDS,
					},
				},
			} );
			expect( windowOpenMock ).toHaveBeenCalledWith(
				'https://example.com/page',
				'_blank'
			);
		} );

		expect( global.location.assign ).not.toHaveBeenCalled();
	} );

	it( 'does not navigate or dismiss from the queue when marking the notification as accepted fails', async () => {
		fetchMock.postOnce( markNotificationsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByRole } = render(
			<CoreSiteBannerNotification { ...defaultProps } />,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Go to page' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( markNotificationsEndpoint );
		} );

		expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
		expect( global.location.assign ).not.toHaveBeenCalled();
		expect( windowOpenMock ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );
} );
