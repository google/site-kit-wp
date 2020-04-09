/**
 * core/site data store: notifications.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { actions } from './index';
import {
	ADD_NOTIFICATION,
	REMOVE_NOTIFICATION,
	FETCH_NOTIFICATIONS,
	RECEIVE_NOTIFICATIONS,
	RECEIVE_NOTIFICATIONS_FAILED,
} from '../../data/create-notifications-store';

describe( 'core/site notifications', () => {
	it( 'has appropriate notification methods', () => {
		const actionsToExpect = [
			'addNotification',
			'removeNotification',
			'fetchNotifications',
			'receiveNotifications',
			'receiveNotificationsFailed',
		];
		expect( Object.keys( actions ) ).toEqual( expect.arrayContaining( actionsToExpect ) );
	} );

	it( 'Dispatches addNotification', () => {
		const notification = {};
		const expectedAction = {
			payload: { notification },
			type: ADD_NOTIFICATION,
		};
		expect( actions.addNotification( notification ) ).toEqual( expectedAction );
	} );

	it( 'Dispatches removeNotification', () => {
		const notificationID = 1337;
		const expectedAction = {
			payload: { id: notificationID },
			type: REMOVE_NOTIFICATION,
		};
		expect( actions.removeNotification( notificationID ) ).toEqual( expectedAction );
	} );

	it( 'Dispatches fetchNotifications', () => {
		const expectedAction = {
			payload: {},
			type: FETCH_NOTIFICATIONS,
		};
		expect( actions.fetchNotifications() ).toEqual( expectedAction );
	} );

	it( 'Dispatches receiveNotifications', () => {
		const notifications = [ {}, {}, {}, {} ];
		const expectedAction = {
			payload: { notifications },
			type: RECEIVE_NOTIFICATIONS,
		};
		expect( actions.receiveNotifications( notifications ) ).toEqual( expectedAction );
	} );

	it( 'Dispatches receiveNotificationsFailed', () => {
		const expectedAction = {
			payload: {},
			type: RECEIVE_NOTIFICATIONS_FAILED,
		};
		expect( actions.receiveNotificationsFailed() ).toEqual( expectedAction );
	} );
} );
