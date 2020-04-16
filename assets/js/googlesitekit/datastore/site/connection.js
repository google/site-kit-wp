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
import { createFetchInfrastructure } from '../../data/create-fetch-infrastructure';

const { createRegistrySelector } = Data;

export const INITIAL_STATE = {
	connection: undefined,
};

const fetchConnectionInfrastructure = createFetchInfrastructure( {
	baseName: 'getConnection',
	controlCallback: () => {
		return API.get( 'core', 'site', 'connection' );
	},
	reducerCallback: ( state, connection ) => {
		return {
			...state,
			connection,
		};
	},
} );

export const actions = {
	...fetchConnectionInfrastructure.actions,
};

export const controls = {
	...fetchConnectionInfrastructure.controls,
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		default: {
			return fetchConnectionInfrastructure.reducer( state, { type, payload } );
		}
	}
};

export const resolvers = {
	...fetchConnectionInfrastructure.resolvers,

	*getConnection() {
		const registry = yield Data.commonActions.getRegistry();

		const existingConnection = registry.select( STORE_NAME ).getConnection();

		if ( ! existingConnection ) {
			yield actions.fetchGetConnection();
		}
	},
};

export const selectors = {
	...fetchConnectionInfrastructure.selectors,

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
	 * @return {Object|undefined} Site connection info.
	 */
	getConnection( state ) {
		const { connection } = state;

		return connection;
	},

	/**
	 * Gets the Site Kit connection status for this site.
	 *
	 * Returns `true` if the site is connected to Site Kit, `false` if
	 * not. Returns `undefined` if the connection info is not available/loaded.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} Site connection status.
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
	 * @return {boolean|undefined} Site reset status.
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
	 * @return {boolean|undefined} Site setup completion status.
	 */
	isSetupCompleted: createRegistrySelector( ( select ) => () => {
		const connection = select( STORE_NAME ).getConnection();

		return typeof connection !== 'undefined' ? connection.setupCompleted : connection;
	} ),
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
