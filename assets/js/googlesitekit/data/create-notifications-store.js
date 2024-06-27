/**
 * Provides API functions to create a datastore for notifications.
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
import { commonActions, combineStores } from 'googlesitekit-data';
import { createFetchStore } from './create-fetch-store';

// Actions
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

/**
 * Creates a store object that includes actions and selectors for managing notifications.
 *
 * The three required parameters hook up the store to the respective REST API endpoint.
 *
 * @since 1.6.0
 * @private
 *
 * @param {string}  type              The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier        The data identifier, eg. a module slug like 'search-console'.
 * @param {string}  datapoint         The endpoint to request data from, e.g. 'notifications'.
 * @param {Object}  options           Optional. Options to consider for the store.
 * @param {boolean} options.client    Enable client-only notifications. `true` by default.
 * @param {boolean} options.server    Enable server notifications. `true` by default.
 * @param {number}  options.storeName Store name to use. Default is '{type}/{identifier}'.
 * @return {Object} The notifications store object, with additional `STORE_NAME` and
 *                  `initialState` properties.
 */
export const createNotificationsStore = (
	type,
	identifier,
	datapoint,
	{ client = true, server = true, storeName = undefined } = {}
) => {
	invariant( type, 'type is required.' );
	invariant( identifier, 'identifier is required.' );
	invariant( datapoint, 'datapoint is required.' );

	const STORE_NAME = storeName || `${ type }/${ identifier }`;

	const initialState = {
		serverNotifications: server ? undefined : {},
		// Initialize clientNotifications as undefined rather than an empty
		// object so we can know if a client notification was added and then
		// removed from state.
		clientNotifications: client ? undefined : {},
	};

	const fetchGetNotificationsStore = createFetchStore( {
		baseName: 'getNotifications',
		controlCallback: () => {
			return API.get( type, identifier, datapoint );
		},
		reducerCallback: ( state, notifications ) => {
			return {
				...state,
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
		},
	} );

	const actions = {
		/**
		 * Adds a notification to the store.
		 *
		 * @since 1.6.0
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
		 * @since 1.6.0
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
	};

	const controls = {};

	// eslint-disable-next-line no-shadow
	const reducer = ( state = initialState, { type, payload } ) => {
		switch ( type ) {
			case ADD_NOTIFICATION: {
				const { notification } = payload;

				return {
					...state,
					clientNotifications: {
						...( state.clientNotifications || {} ),
						[ notification.id ]: notification,
					},
				};
			}

			case REMOVE_NOTIFICATION: {
				const { id } = payload;

				// At this point, only client-side notifications can be removed.
				if (
					'undefined' === typeof state.clientNotifications ||
					'undefined' === typeof state.clientNotifications[ id ]
				) {
					// Trigger a warning clarifying that if a server-side notification is attempted to be removed.
					if (
						'undefined' !== typeof state.serverNotifications &&
						'undefined' !== typeof state.serverNotifications[ id ]
					) {
						global.console.warn(
							`Cannot remove server-side notification with ID "${ id }"; this may be changed in a future release.`
						);
					}

					return state;
				}

				const newNotifications = { ...state.clientNotifications };
				delete newNotifications[ id ];

				return {
					...state,
					clientNotifications: newNotifications,
				};
			}

			default: {
				return state;
			}
		}
	};

	const resolvers = {
		*getNotifications() {
			const registry = yield commonActions.getRegistry();
			const notifications = registry
				.select( STORE_NAME )
				.getNotifications();

			if ( ! notifications ) {
				yield fetchGetNotificationsStore.actions.fetchGetNotifications();
			}
		},
	};

	// If server notifications are disabled, we should remove the getNotifications
	// resolver. If we set it as `undefined` we'll encounter issues with an `undefined`
	// resolver, because @wordpress/data will still try to register the resolver because
	// it sees a key. And this is nicer than a no-op resolver.
	if ( ! server ) {
		delete resolvers.getNotifications;
	}

	const selectors = {
		/**
		 * Gets the current notifications.
		 *
		 * Returns `undefined` if notifications are not available/loaded.
		 *
		 * @since 1.6.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {(Array|undefined)} Current list of notifications.
		 */
		getNotifications( state ) {
			const { serverNotifications, clientNotifications } = state;

			// If there are no client notifications and the server notifications
			// haven't loaded yet, return `undefined` (the value of
			// `serverNotifications` here) to signify to anything using this
			// selector that notifications have not loaded yet.
			if (
				'undefined' === typeof serverNotifications &&
				'undefined' === typeof clientNotifications
			) {
				return serverNotifications;
			}

			// If there are any notifications from either the client or server,
			// we should return them, even if the server notifications haven't
			// finished loading yet.
			return Object.values( {
				...( serverNotifications || {} ),
				...( clientNotifications || {} ),
			} );
		},
	};

	const store = combineStores( fetchGetNotificationsStore, {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	} );
	return {
		...store,
		STORE_NAME,
	};
};
