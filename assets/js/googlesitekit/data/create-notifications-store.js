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
import { keyBy, omit } from 'lodash';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';

const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
const FETCH_NOTIFICATIONS = 'FETCH_NOTIFICATIONS';
const RECEIVE_NOTIFICATIONS = 'RECEIVE_NOTIFICATIONS';
const RECEIVE_NOTIFICATIONS_FAILED = 'RECEIVE_NOTIFICATIONS_FAILED';

// This should remain private for now, hence not be exported on Data.
export const createNotificationsStore = ( type, identifier, datapoint ) => {
	const INITIAL_STATE = {
		serverNotifications: undefined,
		clientNotifications: {},
		isFetchingNotifications: false,
	};

	const actions = {
		addNotification( notification ) {
			return {
				notification,
				type: ADD_NOTIFICATION,
			};
		},

		removeNotification( id ) {
			return {
				id,
				type: REMOVE_NOTIFICATION,
			};
		},

		fetchNotifications() {
			return {
				payload: {},
				type: FETCH_NOTIFICATIONS,
			};
		},

		receiveNotifications( notifications ) {
			invariant( notifications, 'notifications is required.' );

			return {
				payload: { notifications },
				type: RECEIVE_NOTIFICATIONS,
			};
		},

		receiveNotificationsFailed( error ) {
			invariant( error, 'error is required.' );

			return {
				payload: {},
				type: RECEIVE_NOTIFICATIONS_FAILED,
			};
		},
	};

	const controls = {
		[ FETCH_NOTIFICATIONS ]: () => {
			return get( type, identifier, datapoint );
		},
	};

	const reducer = ( state = INITIAL_STATE, action ) => {
		switch ( action.type ) {
			case ADD_NOTIFICATION: {
				const { notification } = action;

				return {
					...state,
					clientNotifications: {
						...state.clientNotifications,
						...keyBy( [ notification ], 'id' ),
					},
				};
			}

			case REMOVE_NOTIFICATION: {
				const { id } = action;

				return {
					...state,
					clientNotifications: omit( state.clientNotifications, [ id ] ),
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
					serverNotifications: {
						...keyBy( notifications, 'id' ),
					},
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
				return actions.receiveNotificationsFailed( err );
			}
		},
	};

	const selectors = {
		getNotifications( state ) {
			const { serverNotifications, clientNotifications } = state;

			return Object.values( {
				...( serverNotifications || {} ),
				...clientNotifications,
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
