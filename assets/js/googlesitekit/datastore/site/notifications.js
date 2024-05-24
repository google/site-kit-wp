/**
 * `core/site` data store: notifications.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { combineStores } from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createNotificationsStore } from '../../data/create-notifications-store';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';
import { actions as errorStoreActions } from '../../data/create-error-store';

const ACCEPTED = 'accepted';
const DISMISSED = 'dismissed';

const isValidNotificationID = ( notificationID ) =>
	'string' === typeof notificationID;

const fetchMarkNotificationStore = createFetchStore( {
	baseName: 'markNotification',
	controlCallback: ( { notificationID, notificationState } ) => {
		return API.set( 'core', 'site', 'mark-notification', {
			notificationID,
			notificationState,
		} );
	},
	argsToParams: ( { notificationID, notificationState } ) => {
		return { notificationID, notificationState };
	},
	validateParams: ( { notificationID, notificationState } = {} ) => {
		invariant(
			[ ACCEPTED, DISMISSED ].includes( notificationState ),
			'notificationState must be accepted or dismissed.'
		);
		invariant(
			isValidNotificationID( notificationID ),
			'a valid notification ID is required to mark a notification.'
		);
	},
} );

const baseActions = {
	/**
	 * Marks the given notification as accepted.
	 *
	 * @since 1.47.0
	 *
	 * @param {string} id Notification ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	acceptNotification: createValidatedAction(
		( notificationID ) => {
			invariant(
				isValidNotificationID( notificationID ),
				'a valid notification ID is required to accept a notification.'
			);
		},
		function* ( notificationID ) {
			const { response, error } =
				yield fetchMarkNotificationStore.actions.fetchMarkNotification(
					{ notificationID, notificationState: ACCEPTED }
				);
			if ( error ) {
				yield errorStoreActions.receiveError(
					error,
					'acceptNotification',
					[ notificationID ]
				);
			}
			return { response, error };
		}
	),

	/**
	 * Marks the given notification as dismissed.
	 *
	 * @since 1.47.0
	 *
	 * @param {string} id Notification ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	dismissNotification: createValidatedAction(
		( notificationID ) => {
			invariant(
				isValidNotificationID( notificationID ),
				'a valid notification ID is required to dismiss a notification.'
			);
		},
		function* ( notificationID ) {
			const { response, error } =
				yield fetchMarkNotificationStore.actions.fetchMarkNotification(
					{ notificationID, notificationState: DISMISSED }
				);
			if ( error ) {
				yield errorStoreActions.receiveError(
					error,
					'dismissNotification',
					[ notificationID ]
				);
			}
			return { response, error };
		}
	),
};

const notifications = combineStores(
	createNotificationsStore( 'core', 'site', 'notifications', {
		storeName: CORE_SITE,
	} ),
	fetchMarkNotificationStore,
	{
		actions: baseActions,
	}
);

export default notifications;
