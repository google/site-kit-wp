/**
 * core/site data store: connection info.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const { createRegistrySelector } = Data;

const fetchGetConnectionStore = createFetchStore( {
	baseName: 'getConnection',
	controlCallback: () => {
		return API.get( 'core', 'site', 'connection', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, connection ) => {
		return {
			...state,
			connection,
		};
	},
} );

const BASE_INITIAL_STATE = {
	connection: undefined,
};

const baseResolvers = {
	*getConnection() {
		const registry = yield Data.commonActions.getRegistry();

		const existingConnection = registry.select( STORE_NAME ).getConnection();

		if ( ! existingConnection ) {
			yield fetchGetConnectionStore.actions.fetchGetConnection();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the connection info for this site.
	 *
	 * Returns `undefined` if the connection info is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   connected: <Boolean>,
	 *   resettable: <Boolean>,
	 *   setupCompleted: <Boolean>,
	 * }
	 * ```
	 *
	 * @private
	 * @since 1.5.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Site connection info.
	 */
	getConnection( state ) {
		const { connection } = state;

		return connection;
	},

	/**
	 * Gets owner ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {number|undefined} Owner ID if it exists, otherwise undefined.
	 */
	getOwnerID: createRegistrySelector( ( select ) => () => {
		const { ownerID } = select( STORE_NAME ).getConnection() || {};

		return ownerID;
	} ),

	/**
	 * Gets information about connected admins.
	 *
	 * @since 1.14.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} TRUE if there are connected admins, otherwise FALSE or undefined if information is not available yet.
	 */
	hasConnectedAdmins: createRegistrySelector( ( select ) => () => {
		const { hasConnectedAdmins } = select( STORE_NAME ).getConnection() || {};

		return hasConnectedAdmins;
	} ),

	/**
	 * Gets the Site Kit connection status for this site.
	 *
	 * Returns `true` if the site is connected to Site Kit, `false` if
	 * not. Returns `undefined` if the connection info is not available/loaded.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Site connection status.
	 */
	isConnected: createRegistrySelector( ( select ) => () => {
		const connection = select( STORE_NAME ).getConnection();

		return typeof connection !== 'undefined' ? connection.connected : connection;
	} ),

	/**
	 * Gets the Site Kit reset availability for this site.
	 *
	 * Returns `true` if the site is connected to Site Kit and
	 * the connection can be reset, `false` if reset is not available.
	 * Returns `undefined` if the connection info is not available/loaded.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Site reset status.
	 */
	isResettable: createRegistrySelector( ( select ) => () => {
		const connection = select( STORE_NAME ).getConnection();

		return typeof connection !== 'undefined' ? connection.resettable : connection;
	} ),

	/**
	 * Gets the Site Kit setup status.
	 *
	 * Returns `true` if the site is connected to Site Kit and
	 * the connection can be reset, `false` if reset is not available.
	 * Returns `undefined` if the connection info is not available/loaded.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Site setup completion status.
	 */
	isSetupCompleted: createRegistrySelector( ( select ) => () => {
		const connection = select( STORE_NAME ).getConnection();

		return typeof connection !== 'undefined' ? connection.setupCompleted : connection;
	} ),
};

const store = Data.combineStores(
	fetchGetConnectionStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
