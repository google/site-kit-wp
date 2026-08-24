/**
 * FeatureTourNotification component tests.
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
 * External dependencies
 */
import { waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import createFeatureTourNotification from '@/js/components/notifications/FeatureTourNotification';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { act, createTestRegistry, render } from '@tests/js/test-utils';

const TOUR_NOTIFICATION_ID = 'testTour';

const tour = {
	slug: TOUR_NOTIFICATION_ID,
	gaEventCategory: 'test_category',
	steps: [
		{
			target: '.googlesitekit-test-tour-target',
			title: 'Test tour title',
			content: 'Test tour content',
		},
	],
};

describe( 'FeatureTourNotification', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	const FeatureTourNotification = createFeatureTourNotification( tour );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( TOUR_NOTIFICATION_ID, {
				Component: FeatureTourNotification,
				areaSlug: NOTIFICATION_AREAS.OVERLAYS,
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
				isDismissible: false,
			} );
	} );

	function renderNotification() {
		return render(
			<div>
				<div className="googlesitekit-test-tour-target" />
				<FeatureTourNotification id={ TOUR_NOTIFICATION_ID } />
			</div>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);
	}

	it( "renders the tour's steps", async () => {
		const { getByText, waitForRegistry } = renderNotification();

		await waitForRegistry();

		await waitFor( () => {
			expect( getByText( /test tour title/i ) ).toBeInTheDocument();
		} );
		expect( getByText( /test tour content/i ) ).toBeInTheDocument();
	} );

	it( 'dismisses the notification once the tour is dismissed', async () => {
		const dismissNotificationSpy = jest.spyOn(
			registry.dispatch( CORE_NOTIFICATIONS ),
			'dismissNotification'
		);

		const { waitForRegistry } = renderNotification();

		await waitForRegistry();

		expect( dismissNotificationSpy ).not.toHaveBeenCalled();

		act( () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedTours( [ TOUR_NOTIFICATION_ID ] );
		} );

		await waitFor( () => {
			expect( dismissNotificationSpy ).toHaveBeenCalledWith(
				TOUR_NOTIFICATION_ID
			);
		} );
	} );
} );
