/**
 * AudienceSegmentationIntroductoryOverlayNotification component tests.
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
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideUserInfo,
	render,
} from '../../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import AudienceSegmentationIntroductoryOverlayNotification, {
	AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from './AudienceSegmentationIntroductoryOverlayNotification';
import * as scrollUtils from '../../../../../util/scroll';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../../constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import {
	getViewportWidth,
	setViewportWidth,
} from '../../../../../../../tests/js/viewport-width-utils';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import { ANALYTICS_4_NOTIFICATIONS } from '../../..';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';

const getNavigationalScrollTopSpy = jest.spyOn(
	scrollUtils,
	'getNavigationalScrollTop'
);
const scrollToSpy = jest.spyOn( global, 'scrollTo' );

describe( 'AudienceSegmentationIntroductoryOverlayNotification', () => {
	const AudienceSegmentationIntroductoryOverlayNotificationComponent =
		withNotificationComponentProps(
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		)( AudienceSegmentationIntroductoryOverlayNotification );

	const notification =
		ANALYTICS_4_NOTIFICATIONS[
			AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
		];

	let registry;
	let originalViewportWidth;

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				setupComplete: true,
			},
		] );

		const userID = registry.select( CORE_USER ).getID();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupCompletedBy( userID + 1 );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			isAudienceSegmentationWidgetHidden: false,
			didSetAudiences: true,
		} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
				notification
			);

		originalViewportWidth = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewportWidth );
	} );

	it( 'should render an introductory overlay notification', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render(
			<AudienceSegmentationIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				'You can now learn more about your site visitor groups by comparing different metrics.'
			)
		).toBeInTheDocument();
	} );

	it( 'should dismiss the notification when the "Got it" button is clicked', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByRole, waitForRegistry } = render(
			<AudienceSegmentationIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		fetchMock.postOnce( dismissItemEndpoint, {
			body: JSON.stringify( [
				AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
			] ),
			status: 200,
		} );

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );
		} );

		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
	} );

	it( 'should scroll to the traffic widget area and dismiss the notification when the notification is clicked', async () => {
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		getNavigationalScrollTopSpy.mockImplementation(
			( selector, breakpoint ) => {
				if (
					selector ===
						'.googlesitekit-widget-area--mainDashboardTrafficAudienceSegmentation' &&
					breakpoint === 'small'
				) {
					return 12345;
				}

				return 0;
			}
		);

		const { getByRole, waitForRegistry } = render(
			<AudienceSegmentationIntroductoryOverlayNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		fetchMock.postOnce( dismissItemEndpoint, {
			body: JSON.stringify( [
				AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
			] ),
			status: 200,
		} );

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Show me/i } ) );
		} );

		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 12345,
			behavior: 'smooth',
		} );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all the conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );
		it( 'is not active when the audiences widget area is hidden', async () => {
			registry
				.dispatch( CORE_USER )
				.setAudienceSegmentationWidgetHidden( true );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
