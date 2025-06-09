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
import {
	commonActions,
	createRegistryControl,
	createRegistrySelector,
	createReducer,
} from 'googlesitekit-data';
import { getStorage } from '../../../util/storage';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	NOTIFICATION_VIEW_CONTEXTS,
} from './constants';
import { CORE_USER } from '../../datastore/user/constants';
import { createValidatedAction } from '../../data/utils';
import { racePrioritizedAsyncTasks } from '../../../util/async';
import { shouldNotificationBeAddedToQueue } from '../util/shouldNotificationBeAddedToQueue';

const INSERT_NOTIFICATION_INTO_RESOLVED_QUEUE =
	'INSERT_NOTIFICATION_INTO_RESOLVED_QUEUE';
const REGISTER_NOTIFICATION = 'REGISTER_NOTIFICATION';
const RECEIVE_QUEUED_NOTIFICATIONS = 'RECEIVE_QUEUED_NOTIFICATIONS';
const DISMISS_NOTIFICATION = 'DISMISS_NOTIFICATION';
const QUEUE_NOTIFICATION = 'QUEUE_NOTIFICATION';
const RESET_QUEUE = 'RESET_QUEUE';
const MARK_NOTIFICATION_SEEN = 'MARK_NOTIFICATION_SEEN';
// Controls.
const POPULATE_QUEUE = 'POPULATE_QUEUE';
const PERSIST_SEEN_NOTIFICATIONS = 'PERSIST_SEEN_NOTIFICATIONS';

const NOTIFICATION_SEEN_STORAGE_KEY = 'googlesitekit_notification_seen';

const storage = getStorage();

const isValidNotificationID = ( notificationID ) =>
	'string' === typeof notificationID;

export const initialState = {
	notifications: {},
	queuedNotifications: {},
	seenNotifications: JSON.parse(
		storage.getItem( NOTIFICATION_SEEN_STORAGE_KEY ) || '{}'
	),
};

export const actions = {
	/**
	 * Adds a notification to the queue of notifications, used when the queue
	 * is already resolved.
	 *
	 * This action is internal and should not be used directly outside of the
	 * `registerNotification()` action.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} id Notification's slug/ID.
	 * @return {Object} Redux-style action.
	 */
	insertNotificationIntoResolvedQueue( id ) {
		return {
			payload: { id },
			type: INSERT_NOTIFICATION_INTO_RESOLVED_QUEUE,
		};
	},
	/**
	 * Registers a notification with a given `id` slug and settings.
	 *
	 * @since 1.132.0
	 * @since 1.146.0 Added `featureFlag` parameter.
	 * @since n.e.x.t Changed to a generator function to allow for state interaction.
	 *
	 * @param {string}         id                           Notification's slug.
	 * @param {Object}         settings                     Notification's settings.
	 * @param {WPComponent}    [settings.Component]         React component used to display the contents of this notification.
	 * @param {number}         [settings.priority]          Notification's priority for ordering (lower number is higher priority, like WordPress hooks). Ideally in increments of 10. Default 10.
	 * @param {string}         [settings.areaSlug]          The slug of the area where the notification should be rendered, e.g. notification-area-banners-above-nav.
	 * @param {string}         [settings.groupID]           Optional. The ID of the group of notifications that should be rendered in their own individual queue. Default 'default'.
	 * @param {Array.<string>} [settings.viewContexts]      Optional. Array of Site Kit contexts, e.g. VIEW_CONTEXT_MAIN_DASHBOARD.
	 * @param {Function}       [settings.checkRequirements] Optional. Callback function to determine if the notification should be queued.
	 * @param {boolean}        [settings.isDismissible]     Optional. Flag to check if the notification should be queued and is not dismissed.
	 * @param {number}         [settings.dismissRetries]    Optional. An integer number denoting how many times a notification should be shown again on dismissal. Default 0.
	 * @param {string}         [settings.featureFlag]       Optional. Feature flag that must be enabled to register the notification.
	 */
	registerNotification: createValidatedAction(
		( id, { Component, areaSlug, viewContexts } ) => {
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
				viewContexts === undefined ||
					( Array.isArray( viewContexts ) &&
						viewContexts.some(
							NOTIFICATION_VIEW_CONTEXTS.includes,
							NOTIFICATION_VIEW_CONTEXTS
						) ),
				`Notification view context should be one of: ${ NOTIFICATION_VIEW_CONTEXTS.join(
					', '
				) }, but "${ viewContexts }" was provided.`
			);
		},
		function* (
			id,
			{
				Component,
				priority = 10,
				areaSlug,
				groupID = NOTIFICATION_GROUPS.DEFAULT,
				viewContexts,
				checkRequirements,
				isDismissible,
				dismissRetries = 0,
				featureFlag = '',
			}
		) {
			// First, we register the notification with the given id and settings.
			yield {
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
						dismissRetries,
						featureFlag,
					},
				},
				type: REGISTER_NOTIFICATION,
			};

			const registry = yield commonActions.getRegistry();

			// If no view contexts were provided, we should instead do a comparison
			// with the "top"/"visible" notification in the queue for this
			// notification's `groupID` to see if the newly-registered notification
			// should be added to the "top"/"visible position" in the queue.
			//
			// This is the usual route for "ad-hoc" notifications that are registered
			// after initial page load, such as Setup Success notifications.
			if ( ! viewContexts?.length ) {
				const { isNotificationDismissed } =
					registry.select( CORE_NOTIFICATIONS );

				const notification = {
					id,
					Component,
					priority,
					areaSlug,
					groupID,
					viewContexts,
					checkRequirements,
					isDismissible,
					dismissRetries,
					featureFlag,
				};

				yield commonActions.await(
					// Wait for all dismissed items to be available before checking
					// for dismissed status.
					Promise.all( [
						registry.resolveSelect( CORE_USER ).getDismissedItems(),
						registry
							.resolveSelect( CORE_USER )
							.getDismissedPrompts(),
					] )
				);

				const isDismissed = isNotificationDismissed( notification.id );

				// Check if the notification should be added to the queue
				// before inserting it.
				if (
					! shouldNotificationBeAddedToQueue( notification, {
						groupID,
						isDismissed,
					} )
				) {
					return;
				}

				// To do this, we'll add the notification to the queue immediately,
				// which will insert it in the right position based on its priority.
				yield actions.insertNotificationIntoResolvedQueue( id );

				return;
			}

			// If view contexts were provided, we need to repopulate the queues
			// because the data store doesn’t know the current `viewContext` and thus
			// can’t figure out if the ones specified are valid/active.
			//
			// This has the unfortunate side effect of causing rotation of the
			// notifications in the queue, so specifying `viewContexts` should
			// be avoided when registering "ad-hoc" notifications that aren't
			// registered on initialization.
			//
			// For each view context, check to see if the notifications have
			// finished resolution for the `getQueuedNotifications` selector.
			//
			// If they have, we need to invalidate the `getQueuedNotifications`
			// resolver for that `viewContext` + `groupID` combination, as it's
			// no longer valid.
			//
			// Note that this is an unlikely scenario, as notifications that are
			// registered after initial page load are usually ad-hoc notifications
			// that do not specify a `viewContext` (because they're intended to be
			// immediately visible).
			//
			// Still: this code is here to ensure that if a notification _is_
			// registered after initial page load, it will be visible in the queue
			// if appropriate.
			const { hasFinishedResolution } =
				registry.select( CORE_NOTIFICATIONS );
			const { invalidateResolution } =
				registry.dispatch( CORE_NOTIFICATIONS );

			viewContexts.forEach( ( viewContext ) => {
				const hasResolvedGetQueuedNotifications = hasFinishedResolution(
					'getQueuedNotifications',
					[ viewContext, groupID ]
				);

				// If the notifications have not been resolved yet, we don't need
				// to do any comparison with the queue, so we can return early.
				if ( ! hasResolvedGetQueuedNotifications ) {
					return;
				}

				// If the notifications have been resolved, we will invalidate
				// the `getQueuedNotifications` resolver for this `viewContext` +
				// `groupID` combination.
				invalidateResolution( 'getQueuedNotifications', [
					viewContext,
					groupID,
				] );
			} );
		}
	),
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
	 * Resets a notification queue.
	 *
	 * @since 1.142.0
	 *
	 * @param {string?} groupID Group ID of queue to reset. Default: default.
	 * @return {Object} Redux-style action.
	 */
	resetQueue( groupID = NOTIFICATION_GROUPS.DEFAULT ) {
		return { type: RESET_QUEUE, payload: { groupID } };
	},
	/**
	 * Populates a queue with qualifying notifications ordered by priority.
	 *
	 * @since 1.142.0
	 *
	 * @param {string}  viewContext View context to populate queue for.
	 * @param {string?} groupID     Group ID of queue to populate. Default: default.
	 * @yield {Object} Redux-style action.
	 */
	*populateQueue( viewContext, groupID = NOTIFICATION_GROUPS.DEFAULT ) {
		yield {
			type: POPULATE_QUEUE,
			payload: {
				viewContext,
				groupID,
			},
		};
	},
	/**
	 * Adds the given notification to its respective queue.
	 *
	 * @since 1.142.0
	 *
	 * @param {Object} notification Notification definition.
	 * @return {Object} Redux-style action.
	 */
	queueNotification( notification ) {
		return {
			payload: {
				notification,
			},
			type: QUEUE_NOTIFICATION,
		};
	},

	/**
	 * Marks a notification as seen on the current date.
	 *
	 * @since 1.153.0
	 *
	 * @param {string} notificationID Notification ID.
	 * @return {Object} Redux-style action.
	 */
	markNotificationSeen: createValidatedAction(
		( notificationID ) => {
			invariant(
				isValidNotificationID( notificationID ),
				'a valid notification ID is required to mark a notification as seen.'
			);
		},
		function* ( notificationID ) {
			const registry = yield commonActions.getRegistry();

			// Only dispatch action for dismissible notifications.
			const notification = registry
				.select( CORE_NOTIFICATIONS )
				.getNotification( notificationID );

			if ( notification?.isDismissible ) {
				const dateSeen = registry
					.select( CORE_USER )
					.getReferenceDate();

				yield {
					payload: { dateSeen, notificationID },
					type: MARK_NOTIFICATION_SEEN,
				};

				yield {
					type: PERSIST_SEEN_NOTIFICATIONS,
				};
			}
		}
	),

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

			// Use prompts if a notification should be shown again until it
			// is dismissed for a certain number of retries.
			if ( notification.dismissRetries > 0 ) {
				const dismissCount = registry
					.select( CORE_USER )
					.getPromptDismissCount( id );

				const expirationInSeconds =
					dismissCount < notification.dismissRetries
						? expiresInSeconds
						: 0;

				return yield commonActions.await(
					registry.dispatch( CORE_USER ).dismissPrompt( id, {
						expiresInSeconds: expirationInSeconds,
					} )
				);
			}

			return yield commonActions.await(
				registry
					.dispatch( CORE_USER )
					.dismissItem( id, { expiresInSeconds } )
			);
		}
	),
};

export const controls = {
	[ POPULATE_QUEUE ]: createRegistryControl(
		( registry ) =>
			async ( { payload } ) => {
				const { viewContext, groupID } = payload;
				const notifications = registry
					.select( CORE_NOTIFICATIONS )
					.getNotifications();

				// Wait for all dismissed items to be available before filtering.
				await Promise.all( [
					registry.resolveSelect( CORE_USER ).getDismissedItems(),
					registry.resolveSelect( CORE_USER ).getDismissedPrompts(),
				] );

				// Get the seen notifications to rotate same priority notifications.
				const seenNotifications = registry
					.select( CORE_NOTIFICATIONS )
					.getSeenNotifications();

				// Get the `isNotificationDismissed` selector to check if a
				// notification is dismissed.
				const { isNotificationDismissed } =
					registry.select( CORE_NOTIFICATIONS );

				let potentialNotifications = Object.values( notifications )
					.filter( ( notification ) => {
						const isDismissed = isNotificationDismissed(
							notification.id
						);

						return shouldNotificationBeAddedToQueue( notification, {
							groupID,
							viewContext,
							// Because all dismissed items are already
							// resolved, this won't return undefined.
							isDismissed,
						} );
					} )
					.map( ( { checkRequirements, ...notification } ) => {
						const viewCount =
							seenNotifications[ notification.id ]?.length || 0;

						return {
							...notification,
							viewCount,
							checkRequirements,
							async check() {
								if ( checkRequirements ) {
									return await checkRequirements( registry );
								}
								return true;
							},
						};
					} )
					.sort( ( a, b ) => a.viewCount - b.viewCount );

				const { queueNotification } =
					registry.dispatch( CORE_NOTIFICATIONS );

				let nextNotification;
				do {
					nextNotification = await racePrioritizedAsyncTasks(
						potentialNotifications
					);
					if ( nextNotification ) {
						queueNotification( nextNotification );
						potentialNotifications = potentialNotifications.filter(
							( n ) => n !== nextNotification
						);
					}
				} while ( nextNotification );
			}
	),
	[ PERSIST_SEEN_NOTIFICATIONS ]: createRegistryControl(
		( registry ) => () => {
			const seenNotifications = registry
				.select( CORE_NOTIFICATIONS )
				.getSeenNotifications();

			storage.setItem(
				NOTIFICATION_SEEN_STORAGE_KEY,
				JSON.stringify( seenNotifications )
			);
		}
	),
};

// eslint-disable-next-line complexity
export const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case INSERT_NOTIFICATION_INTO_RESOLVED_QUEUE: {
			const { id } = payload;

			/**
			 * The notification we want to add to the already-resolved queue.
			 */
			const notification = state.notifications?.[ id ];

			// Don't try to add a notification that is not registered.
			if ( notification === undefined ) {
				global.console.warn(
					`Could not add notification with ID "${ id }" to queue. Notification "${ id }" is not registered.`
				);

				break;
			}

			// If the queue hasn't resolved yet, the queued notifications for this
			// group will be undefined. In this case we return early because this
			// notification will be added to the queue once it resolves.
			if (
				state.queuedNotifications[ notification.groupID ] === undefined
			) {
				global.console.warn(
					`Could not add notification with ID "${ id }" to queue. Queue is not yet populated/resolved.`
				);

				break;
			}

			// If the notification is already in the queue, we don't need to add it
			// again.
			if (
				state.queuedNotifications[ notification.groupID ].some(
					( notificationInQueue ) => notificationInQueue.id === id
				)
			) {
				break;
			}

			// Find the next notification in the queue that has a lower priority than
			// the one we're adding, and add this notification ahead of it.
			//
			// The `findIndex` call will return -1 if we can't find a notification
			// with "lower priority" (eg. has a higher number) than the one we're
			// adding. In that case, we'll add the notification to the end of the
			// queue.
			//
			// If we do find a notification with a lower priority (or the same
			// priority), `findIndex` will return its index, which we can use to
			// insert the new notification after that notification.
			const positionForNewNotification = state.queuedNotifications[
				notification.groupID
			].findIndex( ( notificationInQueue ) => {
				return notificationInQueue.priority >= notification.priority;
			} );

			// Insert the new notification at the position we found, or at the end of
			// the queue if we didn't find any notification with a lower priority.
			state.queuedNotifications[ notification.groupID ].splice(
				positionForNewNotification !== -1
					? positionForNewNotification
					: state.queuedNotifications[ notification.groupID ].length,
				0,
				notification
			);

			break;
		}

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

		case RESET_QUEUE: {
			state.queuedNotifications[ payload.groupID ] = [];
			break;
		}

		case QUEUE_NOTIFICATION: {
			const { groupID, id } = payload.notification;
			state.queuedNotifications[ groupID ] =
				state.queuedNotifications[ groupID ] || [];

			// If the notification is already in the queue, we don't need to
			// add it again.
			if (
				state.queuedNotifications[ groupID ].some(
					( notification ) => notification.id === id
				)
			) {
				break;
			}

			state.queuedNotifications[ groupID ].push( payload.notification );

			break;
		}

		case MARK_NOTIFICATION_SEEN: {
			const { dateSeen, notificationID } = payload;
			const seenNotifications = { ...state.seenNotifications };

			// Initialize array if it doesn't exist.
			if ( ! seenNotifications[ notificationID ] ) {
				seenNotifications[ notificationID ] = [];
			}

			// Only add the date if it's not already in the array.
			if ( ! seenNotifications[ notificationID ].includes( dateSeen ) ) {
				seenNotifications[ notificationID ].push( dateSeen );
			}

			state.seenNotifications = seenNotifications;

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
		yield actions.resetQueue( groupID );
		yield actions.populateQueue( viewContext, groupID );
	},
};

export const selectors = {
	/**
	 * Gets all view dates for each notification, keyed by notification ID.
	 *
	 * @since 1.153.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Object with notification IDs as keys and array of dates viewed as the value.
	 */
	getSeenNotifications( state ) {
		return state.seenNotifications;
	},

	/**
	 * Gets the dates when a specific notification was seen.
	 *
	 * @since 1.153.0
	 *
	 * @param {Object} state          Data store's state.
	 * @param {string} notificationID Notification ID.
	 * @return {Array} Array of dates when the notification was seen.
	 */
	getNotificationSeenDates( state, notificationID ) {
		const { seenNotifications } = state;
		return seenNotifications[ notificationID ] ?? [];
	},

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
	 * If the notification should appear again for a certain number of times after dismissal,
	 * then we store them as prompts. So we check for dismissed prompts instead of dismissed items.
	 *
	 * @since 1.132.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} id    Notification id.
	 * @return {(boolean|undefined)} TRUE if dismissed, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isNotificationDismissed: createRegistrySelector(
		( select ) => ( state, id ) => {
			const notification =
				select( CORE_NOTIFICATIONS ).getNotification( id );

			if ( notification === undefined ) {
				return undefined;
			}

			if ( notification.dismissRetries > 0 ) {
				return select( CORE_USER ).isPromptDismissed( id );
			}

			return select( CORE_USER ).isItemDismissed( id );
		}
	),
	/**
	 * Determines whether a notification that can reappear again for a fixed number of times
	 * on dismissal is at its final appearance.
	 *
	 * @since 1.145.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} id    Notification id.
	 * @return {(boolean|undefined)} TRUE if notification is on its final retry, otherwise FALSE, `undefined` if not resolved yet.
	 */
	isNotificationDismissalFinal: createRegistrySelector(
		( select ) => ( state, id ) => {
			const notification =
				select( CORE_NOTIFICATIONS ).getNotification( id );

			if ( notification === undefined ) {
				return undefined;
			}

			invariant(
				notification.isDismissible,
				'Notification should be dismissible to check if a notification is on its final dismissal.'
			);

			// If a notification does not have retries, it always will be on its final render.
			if ( notification.dismissRetries === 0 ) {
				return true;
			}

			const dismissCount =
				select( CORE_USER ).getPromptDismissCount( id );

			if ( dismissCount >= notification.dismissRetries ) {
				return true;
			}

			return false;
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
