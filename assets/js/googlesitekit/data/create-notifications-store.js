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
import { get } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from './create-fetch-store';

/**
 * Creates a store object that includes actions and selectors for managing notifications.
 *
 * The three required parameters hook up the store to the respective REST API endpoint.
 *
 * @since 1.6.0
 * @private
 *
 * @param {string}  type              The data to access. One of 'core' or 'modules'.
 * @param {string}  identifier        The data identifier, eg. a module slug like search-console.
 * @param {string}  datapoint         The endpoint to request data from, e.g. 'notifications'.
 * @param {Object}  options           Optional. Options to consider for the store.
 * @param {boolean} options.server    Enable server notifications. `true` by default.
 * @param {number}  options.storeName Store name to use. Default is '{type}/{identifier}'.
 * @return {Object} The notifications store object, with additional `STORE_NAME` and
 *                  `initialState` properties.
 */
export function createNotificationsStore(
	type,
	identifier,
	datapoint,
	{ server = true, storeName = undefined } = {}
) {
	invariant( type, 'type is required.' );
	invariant( identifier, 'identifier is required.' );
	invariant( datapoint, 'datapoint is required.' );

	const STORE_NAME = storeName || `${ type }/${ identifier }`;

	const initialState = {
		serverNotifications: server ? undefined : {},
	};

	const fetchGetNotificationsStore = createFetchStore( {
		baseName: 'getNotifications',
		controlCallback: () => {
			return get( type, identifier, datapoint );
		},
		reducerCallback: createReducer( ( state, notifications ) => {
			state.serverNotifications = notifications.reduce(
				( acc, notification ) => {
					return {
						...acc,
						[ notification.id ]: notification,
					};
				},
				{}
			);
		} ),
	} );

	const actions = {};

	const controls = {};

	// eslint-disable-next-line no-shadow
	function reducer( state = initialState, { type } ) {
		switch ( type ) {
			default: {
				return state;
			}
		}
	}

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
			const { serverNotifications } = state;

			// If there are no client notifications and the server notifications
			// haven't loaded yet, return `undefined` (the value of
			// `serverNotifications` here) to signify to anything using this
			// selector that notifications have not loaded yet.
			if ( 'undefined' === typeof serverNotifications ) {
				return serverNotifications;
			}

			// If there are any notifications from either the client or server,
			// we should return them, even if the server notifications haven't
			// finished loading yet.
			return Object.values( {
				...( serverNotifications || {} ),
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
}
