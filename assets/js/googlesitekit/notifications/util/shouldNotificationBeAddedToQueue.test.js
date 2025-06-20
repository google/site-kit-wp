/**
 * `shouldNotificationBeAddedToQueue` tests.
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
import { NOTIFICATION_AREAS, NOTIFICATION_GROUPS } from '../constants';
import { shouldNotificationBeAddedToQueue } from './shouldNotificationBeAddedToQueue';
import {
	VIEW_CONTEXT_ADMIN_BAR,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '../../constants';

describe( 'shouldNotificationBeAddedToQueue', () => {
	const id = 'test-notification-id';
	function TestNotificationComponent( props ) {
		return <div>Hello { props.children }!</div>;
	}

	it( 'checks the feature flag of a notification', () => {
		// Create the notification so it can be checked.
		const notificationToCheck = {
			id,
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			priority: 11,
			featureFlag: 'test-feature-flag',
			isDismissible: false,
		};

		expect( shouldNotificationBeAddedToQueue( notificationToCheck ) ).toBe(
			false
		);

		expect(
			shouldNotificationBeAddedToQueue( notificationToCheck, {
				_enabledFeatureFlags: [ 'test-feature-flag' ],
			} )
		).toBe( true );
	} );

	it( 'checks if a notification is dismissed', () => {
		// Create the notification so it can be checked.
		const nonDismissibleNotification = {
			id: 'non-dismissible-notification',
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			priority: 11,
			// A notification that is not dismissible should not be checked.
			isDismissible: false,
		};

		expect(
			shouldNotificationBeAddedToQueue( nonDismissibleNotification, {
				isDismissed: true,
			} )
		).toBe( true );

		const dismissibleNotification = {
			id: 'non-dismissible-notification',
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			priority: 11,
			isDismissible: true,
		};

		expect(
			shouldNotificationBeAddedToQueue( dismissibleNotification, {
				isDismissed: true,
			} )
		).toBe( false );

		expect(
			shouldNotificationBeAddedToQueue( dismissibleNotification, {
				isDismissed: false,
			} )
		).toBe( true );
	} );

	it( 'checks the groupID', () => {
		// Create the notification so it can be checked.
		const notificationToCheck = {
			id,
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
			priority: 11,
		};

		// If no groupID is provided, the comparison should fail.
		expect( shouldNotificationBeAddedToQueue( notificationToCheck ) ).toBe(
			false
		);

		expect(
			shouldNotificationBeAddedToQueue( notificationToCheck, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			} )
		).toBe( true );

		expect(
			shouldNotificationBeAddedToQueue( notificationToCheck, {
				groupID: NOTIFICATION_GROUPS.HEADER,
			} )
		).toBe( false );
	} );

	it( 'checks the viewContexts, if provided', () => {
		// Create the notification so it can be checked.
		const notificationWithViewContexts = {
			id,
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			viewContexts: [
				VIEW_CONTEXT_MAIN_DASHBOARD,
				VIEW_CONTEXT_ENTITY_DASHBOARD,
			],
			priority: 11,
		};

		expect(
			shouldNotificationBeAddedToQueue( notificationWithViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} )
		).toBe( true );

		expect(
			shouldNotificationBeAddedToQueue( notificationWithViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
			} )
		).toBe( true );

		expect(
			shouldNotificationBeAddedToQueue( notificationWithViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContext: VIEW_CONTEXT_ADMIN_BAR,
			} )
		).toBe( false );

		expect(
			shouldNotificationBeAddedToQueue( notificationWithViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContext: VIEW_CONTEXT_ADMIN_BAR,
			} )
		).toBe( false );

		const notificationWithoutViewContexts = {
			id,
			Component: TestNotificationComponent,
			areaSlug: NOTIFICATION_AREAS.HEADER,
			groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			priority: 11,
		};

		expect(
			shouldNotificationBeAddedToQueue( notificationWithoutViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
			} )
		).toBe( true );

		// Notifications without viewContexts restrictions should be added to any
		// queue, regardless of the `viewContext` supplied.
		expect(
			shouldNotificationBeAddedToQueue( notificationWithoutViewContexts, {
				groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} )
		).toBe( true );
	} );
} );
