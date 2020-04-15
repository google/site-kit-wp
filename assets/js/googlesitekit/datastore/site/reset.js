/**
 * core/site data store: reset connection.
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
import { initializeAction } from '../../data/utils';
import { createFetchInfrastructure } from '../../data/create-fetch-infrastructure';

const { createRegistrySelector } = Data;

export const INITIAL_STATE = {};

const fetchResetInfrastructure = createFetchInfrastructure( {
	baseName: 'reset',
	apiCallback: () => {
		return API.set( 'core', 'site', 'reset' );
	},
	receiveCallback: () => {
		return {
			...INITIAL_STATE,
		};
	},
} );

export const actions = {
	...fetchResetInfrastructure.actions,

	/**
	 * Resets the website's connection info to Site Kit.
	 *
	 * WARNING: This causes the website's connection with Google Site Kit to be
	 * removed and will require re-authentication. Use this action with caution,
	 * and always request user confirmation before dispatching.
	 *
	 * @since 1.5.0
	 */
	*reset() {
		const { error } = yield actions.fetchReset();

		if ( ! error ) {
			yield initializeAction();
		}
	},
};

export const controls = {
	...fetchResetInfrastructure.controls,
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		default: {
			return fetchResetInfrastructure.reducer( state, { type, payload } );
		}
	}
};

export const resolvers = {
	...fetchResetInfrastructure.resolvers,
};

export const selectors = {
	...fetchResetInfrastructure.selectors,

	/**
	 * Checks if reset action is in-process.
	 *
	 * @since 1.5.0
	 *
	 * @return {boolean} `true` if resetting is in-flight; `false` if not.
	 */
	isDoingReset: createRegistrySelector( ( select ) => () => {
		return select( STORE_NAME ).isFetchingReset();
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
