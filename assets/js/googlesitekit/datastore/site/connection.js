/**
 * `core/site` data store: connection info.
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
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const fetchGetConnectionStore = createFetchStore( {
	baseName: 'getConnection',
	controlCallback: () => {
		return get( 'core', 'site', 'connection', undefined, {
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

const baseInitialState = {
	connection: undefined,
};

const baseResolvers = {
	*getConnection() {
		const registry = yield commonActions.getRegistry();

		const existingConnection = registry.select( CORE_SITE ).getConnection();

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
	 * @since 1.5.0
	 * @private
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
	 * @since 1.16.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {number|undefined} Owner ID if it exists, otherwise undefined.
	 */
	getOwnerID: createRegistrySelector( ( select ) => () => {
		const { ownerID } = select( CORE_SITE ).getConnection() || {};

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
		const { hasConnectedAdmins } =
			select( CORE_SITE ).getConnection() || {};

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
		const connection = select( CORE_SITE ).getConnection();

		return typeof connection !== 'undefined'
			? connection.connected
			: connection;
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
		const connection = select( CORE_SITE ).getConnection();

		return typeof connection !== 'undefined'
			? connection.resettable
			: connection;
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
		const connection = select( CORE_SITE ).getConnection();

		return typeof connection !== 'undefined'
			? connection.setupCompleted
			: connection;
	} ),

	/**
	 * Gets the Site Kit information about admin users.
	 *
	 * Returns `true` if the site has multiple admins, `false` if it has just one admin.
	 *
	 * @since 1.29.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Multiple admins status.
	 */
	hasMultipleAdmins: createRegistrySelector( ( select ) => () => {
		return select( CORE_SITE ).getConnection()?.hasMultipleAdmins;
	} ),
};

const store = combineStores( fetchGetConnectionStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
