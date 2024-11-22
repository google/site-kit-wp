/**
 * `core/notifications` data store: notifications info.
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
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { commonActions, createRegistrySelector } from 'googlesitekit-data';
import { createReducer } from '../../../../js/googlesitekit/data/create-reducer';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	NOTIFICATION_VIEW_CONTEXTS,
} from './constants';
import { CORE_USER } from '../../datastore/user/constants';
import { createValidatedAction } from '../../data/utils';

const REGISTER_NOTIFICATION = 'REGISTER_NOTIFICATION';
const RECEIVE_QUEUED_NOTIFICATIONS = 'RECEIVE_QUEUED_NOTIFICATIONS';
const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';

export const initialState = {
	notifications: {},
	queuedNotifications: {},
};

export const actions = {
	/**
	 * Registers a notification with a given `id` slug and settings.
	 *
	 * @since 1.132.0
	 *
	 * @param {string}         id                           Notification's slug.
	 * @param {Object}         settings                     Notification's settings.
	 * @param {WPComponent}    [settings.Component]         React component used to display the contents of this notification.
	 * @param {number}         [settings.priority]          Notification's priority for ordering (lower number is higher priority, like WordPress hooks). Ideally in increments of 10. Default 10.
	 * @param {string}         [settings.areaSlug]          The slug of the area where the notification should be rendered, e.g. notification-area-banners-above-nav.
	 * @param {string}         [settings.groupID]           The ID of the group of notifications that should be rendered in their own individual queue.
	 * @param {Array.<string>} [settings.viewContexts]      Array of Site Kit contexts, e.g. VIEW_CONTEXT_MAIN_DASHBOARD.
	 * @param {Function}       [settings.checkRequirements] Optional. Callback function to determine if the notification should be queued.
	 * @param {boolean}        [settings.isDismissible]     Flag to check if the notification should be queued and is not dismissed.
	 * @return {Object} Redux-style action.
	 */
	registerNotification(
		id,
		{
			Component,
			priority = 10,
			areaSlug,
			groupID = NOTIFICATION_GROUPS.DEFAULT,
			viewContexts,
			checkRequirements,
			isDismissible,
		}
	) {
		invariant(
			Component,
			'Component is required to register a notification.'
		);

		const notificationAreas = Object.values( NOTIFICATION_AREAS );
		invariant(
			notificationAreas.includes( areaSlug ),
			`Notification area should be one of: ${ notificationAreas.join(
				', '
			) }, but "${ areaSlug }" was provided.`
		);

		invariant(
			Array.isArray( viewContexts ) &&
				viewContexts.some(
					NOTIFICATION_VIEW_CONTEXTS.includes,
					NOTIFICATION_VIEW_CONTEXTS
				),
			`Notification view context should be one of: ${ NOTIFICATION_VIEW_CONTEXTS.join(
				', '
			) }, but "${ viewContexts }" was provided.`
		);

		return {
			payload: {
				id,
				settings: {
					Component,
					priority,
					areaSlug,
					groupID,
					viewContexts,
					checkRequirements,
					isDismissible,
				},
			},
			type: REGISTER_NOTIFICATION,
		};
	},
	receiveQueuedNotifications(
		queuedNotifications,
		groupID = NOTIFICATION_GROUPS.DEFAULT
	) {
		return {
			payload: {
				queuedNotifications,
				groupID,
			},
			type: RECEIVE_QUEUED_NOTIFICATIONS,
		};
	},
	/**
	 * Dismisses the given notification by its id.
	 *
	 * Currently, this action simply dispatches the call to the dismissed items API.
	 * We can potentially add more notification-specific dismissal logic here in the future.
	 *
	 * @since 1.132.0
	 *
	 * @param {string} id                            Notification id to dismiss.
	 * @param {Object} options                       Dismiss notification options.
	 * @param {number} [options.expiresInSeconds]    Optional. An integer number of seconds for expiry. 0 denotes permanent dismissal. Default 0.
	 * @param {number} [options.skipHidingFromQueue] Optional. A boolean value if notification should not be removed from the queue immediately.
	 * @return {Object} Generator instance.
	 */
	dismissNotification: createValidatedAction(
		( id, options = {} ) => {
			invariant(
				id,
				'A notification id is required to dismiss a notification.'
			);
			const { expiresInSeconds = 0 } = options;
			invariant(
				Number.isInteger( expiresInSeconds ),
				'expiresInSeconds must be an integer.'
			);
		},
		function* ( id, options = {} ) {
			const { expiresInSeconds = 0 } = options;
			const registry = yield commonActions.getRegistry();

			if ( ! options.skipHidingFromQueue ) {
				// Remove the notification from the queue of notifications in state.
				yield {
					type: DISMISS_NOTIFICATION,
					payload: { id },
				};
			}

			const notification = registry
				.select( CORE_NOTIFICATIONS )
				.getNotification( id );

			// Skip persisting notification dismissal in database if the notification is not dismissible.
			if ( notification.isDismissible !== true ) {
				return;
			}

			return yield commonActions.await(
				registry
					.dispatch( CORE_USER )
					.dismissItem( id, { expiresInSeconds } )
			);
		}
	),
};

export const controls = {};

export const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case REGISTER_NOTIFICATION: {
			const { id, settings } = payload;

			if ( state.notifications[ id ] !== undefined ) {
				global.console.warn(
					`Could not register notification with ID "${ id }". Notification "${ id }" is already registered.`
				);
			} else {
				state.notifications[ id ] = { ...settings, id };
			}

			break;
		}

		case RECEIVE_QUEUED_NOTIFICATIONS: {
			state.queuedNotifications[ payload.groupID ] =
				payload.queuedNotifications;
			break;
		}

		case DISMISS_NOTIFICATION: {
			const { id } = payload;

			const groupID = state.notifications?.[ id ]?.groupID;

			const dismissedNotificationIndex = state.queuedNotifications[
				groupID
			]?.findIndex( ( notification ) => notification.id === id );

			if ( dismissedNotificationIndex >= 0 ) {
				state.queuedNotifications[ groupID ].splice(
					dismissedNotificationIndex,
					1
				);
			}
			break;
		}

		default:
			break;
	}
} );

export const resolvers = {
	*getQueuedNotifications(
		viewContext,
		groupID = NOTIFICATION_GROUPS.DEFAULT
	) {
		const registry = yield commonActions.getRegistry();

		const notifications = registry
			.select( CORE_NOTIFICATIONS )
			.getNotifications();

		// Wait for all dismissed items to be available before filtering.
		yield commonActions.await(
			registry.resolveSelect( CORE_USER ).getDismissedItems()
		);

		const filteredNotifications = Object.values( notifications ).filter(
			( notification ) => {
				if ( notification.groupID !== groupID ) {
					return false;
				}

				if ( ! notification.viewContexts.includes( viewContext ) ) {
					return false;
				}

				if (
					!! notification.isDismissible &&
					registry
						.select( CORE_NOTIFICATIONS )
						.isNotificationDismissed( notification.id )
				) {
					return false;
				}

				return true;
			}
		);

		const checkRequirementsResults = yield commonActions.await(
			Promise.all(
				filteredNotifications.map( async ( { checkRequirements } ) => {
					if ( typeof checkRequirements === 'function' ) {
						try {
							return await checkRequirements(
								registry,
								viewContext
							);
						} catch ( e ) {
							return false; // Prevent `Promise.all()` from being rejected for a single failed promise.
						}
					}

					return true;
				} )
			)
		);

		const queuedNotifications = filteredNotifications.filter(
			( _, i ) => !! checkRequirementsResults[ i ]
		);

		queuedNotifications.sort( ( a, b ) => {
			return a.priority - b.priority;
		} );

		yield actions.receiveQueuedNotifications(
			queuedNotifications,
			groupID
		);
	},
};

export const selectors = {
	/**
	 * Fetches all registered notifications from state, regardless of whether they are dismissed or not.
	 *
	 * @since 1.133.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of notification objects.
	 */
	getNotifications: ( state ) => {
		return state.notifications;
	},
	/**
	 * Fetches a registered notification by ID from state.
	 *
	 * @since 1.138.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} id    Notification ID.
	 * @return {(Object|undefined)} The registered notification object or undefined if a notification with the given ID is not registered.
	 */
	getNotification: ( state, id ) => {
		return state.notifications[ id ];
	},
	/**
	 * Fetches the queue of registered notifications which are filtered and sorted.
	 *
	 * Notifications are filtered and sorted in the corresponding resolver.
	 * They are filtered based on the given `viewContext`, their dismissal state
	 * and their `checkRequirements` callback. They are sorted by their `priority`.
	 *
	 * @since 1.133.0
	 *
	 * @param {Object} state       Data store's state.
	 * @param {string} viewContext The viewContext to fetch notifications for.
	 * @param {string} groupID     The groupID of the notification queue to fetch notifications for.
	 * @return {(Array|undefined)} Array of notification objects.
	 */
	getQueuedNotifications: (
		state,
		viewContext,
		groupID = NOTIFICATION_GROUPS.DEFAULT
	) => {
		invariant( viewContext, 'viewContext is required.' );

		return state.queuedNotifications[ groupID ];
	},
	/**
	 * Determines whether a notification is dismissed or not.
	 *
	 * Currently, this selector simply forwards the call to the dismissed items API.
	 * We can potentially add more notification-specific logic here in the future.
	 *
	 * @since 1.132.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} id    Notification id.
	 * @return {(boolean|undefined)} TRUE if dismissed, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isNotificationDismissed: createRegistrySelector(
		( select ) => ( state, id ) => {
			return select( CORE_USER ).isItemDismissed( id );
		}
	),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
