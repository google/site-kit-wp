/**
 * Provides API functions to create a datastore for notifications.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';

// Actions
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
const FETCH_NOTIFICATIONS = 'FETCH_NOTIFICATIONS';
const RECEIVE_NOTIFICATIONS = 'RECEIVE_NOTIFICATIONS';
const RECEIVE_NOTIFICATIONS_FAILED = 'RECEIVE_NOTIFICATIONS_FAILED';

/**
 * Creates a store object that includes actions and selectors for managing notifications.
 *
 * The three required parameters hook up the store to the respective REST API endpoint.
 *
 * @since n.e.x.t
 * @private
 * @param {string} type       The data to access. One of 'core' or 'modules'.
 * @param {string} identifier The data identifier, eg. a module slug like 'search-console'.
 * @param {string} datapoint  The endpoint to request data from, e.g. 'notifications'.
 * @return {Object} The notifications store object.
 */
export const createNotificationsStore = ( type, identifier, datapoint ) => {
	const INITIAL_STATE = {
		serverNotifications: undefined,
		// Initialize clientNotifications as undefined rather than an empty
		// object so we can know if a client notification was added and then
		// removed from state.
		clientNotifications: undefined,
		isFetchingNotifications: false,
	};

	const actions = {
		/**
		 * Adds a notification to the store.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} notification Notification object to add.
		 * @return {Object} Redux-style action.
		 */
		addNotification( notification ) {
			invariant( notification, 'notification is required.' );

			return {
				payload: { notification },
				type: ADD_NOTIFICATION,
			};
		},

		/**
		 * Removes a notification from the store.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} id ID of the notification to remove.
		 * @return {Object} Redux-style action.
		 */
		removeNotification( id ) {
			invariant( id, 'id is required.' );

			return {
				payload: { id },
				type: REMOVE_NOTIFICATION,
			};
		},

		/**
		 * Dispatches an action that creates an HTTP request to the notifications endpoint.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @return {Object} Redux-style action.
		 */
		fetchNotifications() {
			return {
				payload: {},
				type: FETCH_NOTIFICATIONS,
			};
		},

		/**
		 * Stores notifications received from the REST API.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Array} notifications Notifications from the API.
		 * @return {Object} Redux-style action.
		 */
		receiveNotifications( notifications ) {
			invariant( notifications, 'notifications is required.' );

			return {
				payload: { notifications },
				type: RECEIVE_NOTIFICATIONS,
			};
		},

		/**
		 * Dispatches an action signifying the `fetchNotifications` side-effect failed.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @return {Object} Redux-style action.
		 */
		receiveNotificationsFailed() {
			return {
				payload: {},
				type: RECEIVE_NOTIFICATIONS_FAILED,
			};
		},
	};

	const controls = {
		[ FETCH_NOTIFICATIONS ]: () => {
			return API.get( type, identifier, datapoint );
		},
	};

	const reducer = ( state = INITIAL_STATE, action ) => {
		switch ( action.type ) {
			case ADD_NOTIFICATION: {
				const { notification } = action.payload;

				return {
					...state,
					clientNotifications: {
						...state.clientNotifications || {},
						[ notification.id ]: notification,
					},
				};
			}

			case REMOVE_NOTIFICATION: {
				const { id } = action.payload;

				// At this point, only client-side notifications can be removed.
				if (
					'undefined' === typeof state.clientNotifications ||
					'undefined' === typeof state.clientNotifications[ id ]
				) {
					// Trigger a warning clarifying that if a server-side notification is attempted to be removed.
					if ( 'undefined' !== typeof state.serverNotifications &&
						'undefined' !== typeof state.serverNotifications[ id ]
					) {
						global.console.warn( `Cannot remove server-side notification with ID "${ id }"; this may be changed in a future release.` );
					}

					return { ...state };
				}

				const newNotifications = { ...state.clientNotifications };
				delete newNotifications[ id ];

				return {
					...state,
					clientNotifications: newNotifications,
				};
			}

			case FETCH_NOTIFICATIONS: {
				return {
					...state,
					isFetchingNotifications: true,
				};
			}

			case RECEIVE_NOTIFICATIONS: {
				const { notifications } = action.payload;

				return {
					...state,
					isFetchingNotifications: false,
					serverNotifications: notifications.reduce(
						( acc, notification ) => {
							return {
								...acc,
								[ notification.id ]: notification,
							};
						},
						{}
					),
				};
			}

			case RECEIVE_NOTIFICATIONS_FAILED: {
				return {
					...state,
					isFetchingNotifications: false,
				};
			}

			default: {
				return { ...state };
			}
		}
	};

	const resolvers = {
		*getNotifications() {
			try {
				const notifications = yield actions.fetchNotifications();
				return actions.receiveNotifications( notifications );
			} catch ( err ) {
				return actions.receiveNotificationsFailed();
			}
		},
	};

	const selectors = {
		/**
		 * Gets the current notifications.
		 *
		 * Returns `undefined` if notifications are not available/loaded.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {Array|undefined} Current list of notifications.
		 */
		getNotifications( state ) {
			const { serverNotifications, clientNotifications } = state;

			// If there are no client notifications and the server notifications
			// haven't loaded yet, return `undefined` (the value of
			// `serverNotifications` here) to signify to anything using this
			// selector that notifications have not loaded yet.
			if ( 'undefined' === typeof serverNotifications && 'undefined' === typeof clientNotifications ) {
				return serverNotifications;
			}

			// If there are any notifications from either the client or server,
			// we should return them, even if the server notifications haven't
			// finished loading yet.
			return Object.values( {
				...serverNotifications || {},
				...clientNotifications || {},
			} );
		},
	};

	return {
		INITIAL_STATE,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};
