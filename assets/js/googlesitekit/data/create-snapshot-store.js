/**
 * Provides a datastore for snapshotting and restoring state.
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
import Data from 'googlesitekit-data';
import { deleteItem, getItem, setItem } from '../api/cache';
import { HOUR_IN_SECONDS } from '../../util';

const { createRegistryControl } = Data;

// Actions
const CREATE_SNAPSHOT = 'CREATE_SNAPSHOT';
const DELETE_SNAPSHOT = 'DELETE_SNAPSHOT';
const RESTORE_SNAPSHOT = 'RESTORE_SNAPSHOT';
const SET_STATE_FROM_SNAPSHOT = 'SET_STATE_FROM_SNAPSHOT';

/**
 * Creates a store object that includes actions and controls for restoring/creating state snapshots.
 *
 * @since 1.9.0
 * @private
 *
 * @param {string} storeName The name of the store to snapshot in the cache.
 * @return {Object} The snapshot store object.
 */
export const createSnapshotStore = ( storeName ) => {
	invariant( storeName, 'storeName is required to create a snapshot store.' );

	const initialState = {};

	const actions = {
		/**
		 * Deletes a snapshot of state for a storeName, using our cache API.
		 *
		 * @since 1.9.0
		 * @private
		 *
		 * @return {boolean} Cache deletion response.
		 */
		*deleteSnapshot() {
			const cacheResult = yield {
				payload: {},
				type: DELETE_SNAPSHOT,
			};

			return cacheResult;
		},

		/**
		 * Restores a snapshot of state for a storeName, if available, using our cache API.
		 *
		 * @since 1.9.0
		 * @private
		 *
		 * @param {Object}  [options]                   Options object.
		 * @param {boolean} [options.clearAfterRestore] Whether or not to delete snapshot after restore. Default: true.
		 * @return {boolean} Cache restoration response.
		 */
		*restoreSnapshot( options = {} ) {
			const { clearAfterRestore = true } = options;
			const { cacheHit, value } = yield {
				payload: {},
				type: RESTORE_SNAPSHOT,
			};

			if ( cacheHit ) {
				yield {
					payload: { snapshot: value },
					type: SET_STATE_FROM_SNAPSHOT,
				};

				if ( clearAfterRestore ) {
					yield {
						payload: {},
						type: DELETE_SNAPSHOT,
					};
				}
			}

			return cacheHit;
		},

		/**
		 * Creates a snapshot of the current state of this store, using our cache API.
		 *
		 * @since 1.9.0
		 * @private
		 *
		 * @return {boolean} Cache write response.
		 */
		*createSnapshot() {
			const cacheResult = yield {
				payload: {},
				type: CREATE_SNAPSHOT,
			};

			return cacheResult;
		},
	};

	const controls = {
		[ DELETE_SNAPSHOT ]: () => {
			return deleteItem( `datastore::cache::${ storeName }` );
		},
		[ CREATE_SNAPSHOT ]: createRegistryControl( ( registry ) => () => {
			return setItem(
				`datastore::cache::${ storeName }`,
				registry.stores[ storeName ].store.getState()
			);
		} ),
		[ RESTORE_SNAPSHOT ]: () => {
			// Only get snapshots made within the last hour.
			return getItem(
				`datastore::cache::${ storeName }`,
				HOUR_IN_SECONDS
			);
		},
	};

	const reducer = ( state = initialState, { type, payload } ) => {
		// eslint-disable-line no-shadow
		switch ( type ) {
			case SET_STATE_FROM_SNAPSHOT: {
				const { snapshot } = payload;
				// Exclude any top-level errors from the restored state.
				// eslint-disable-next-line no-unused-vars
				const { error, ...newState } = snapshot;

				return newState;
			}

			default: {
				return state;
			}
		}
	};

	return { initialState, actions, controls, reducer };
};

/**
 * Inspects a registry to find all stores that support our snapshot features.
 *
 * @since 1.9.0
 * @private
 *
 * @param {wp.data.registry} registry Optional. Registry object to inspect for stores that support state restoration. Defaults to `googlesitekit.data`.
 * @return {Object} The snapshot store object.
 */
export const getStoresWithSnapshots = ( registry = Data ) => {
	return Object.keys( registry.stores ).reduce( ( acc, storeName ) => {
		if (
			Object.keys( registry.stores[ storeName ].getActions() ).includes(
				'restoreSnapshot'
			)
		) {
			return { ...acc, [ storeName ]: registry.stores[ storeName ] };
		}

		return acc;
	}, {} );
};

/**
 * Creates snapshots of all supporting stores.
 *
 * @since 1.9.0
 * @private
 *
 * @param {wp.data.registry} [registry] Optional. Registry object to inspect for stores that support state restoration. Defaults to `googlesitekit.data`.
 * @return {Promise} Promise resolves once all snapshots have been taken.
 */
export const snapshotAllStores = ( registry = Data ) => {
	return Promise.all(
		Object.values( getStoresWithSnapshots( registry ) ).map( ( store ) => {
			return store.getActions().createSnapshot();
		} )
	);
};

/**
 * Restores state for all snapshots that support it.
 *
 * Only restores snapshots for stores that have `restoreSnapshot` action, and
 * clears the snapshot afterward, so more stores will not be restored unless
 * a snapshot was saved on the last pageview.
 *
 * @since 1.9.0
 * @private
 *
 * @param {wp.data.registry} [registry] Optional. Registry object to inspect for stores that support state restoration. Defaults to `googlesitekit.data`.
 * @return {Promise} Promise resolves once all snapshots have been restored.
 */
export const restoreAllSnapshots = ( registry = Data ) => {
	return Promise.all(
		Object.values( getStoresWithSnapshots( registry ) ).map( ( store ) => {
			return store.getActions().restoreSnapshot();
		} )
	);
};

/**
 * Creates snapshot of provided store.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string}           storeName The name of the store to snapshot in the cache.
 * @param {wp.data.registry} registry  Optional. Registry object to inspect for stores that support state restoration. Defaults to `googlesitekit.data`.
 * @return {boolean|undefined} True if snapshot was created. False if not. Undefined if store with snapshot was not found.
 */
export const snapshotStore = ( storeName, registry = Data ) => {
	const store = getStoresWithSnapshots( registry )?.[ storeName ];

	if ( ! store ) {
		return undefined;
	}

	return store.getActions().createSnapshot();
};
