/**
 * `core/user` data store: initial setup settings.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { set } from 'googlesitekit-api';
import { combineStores, createReducer } from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';

const fetchSaveInitialSetupStore = createFetchStore( {
	baseName: 'saveInitialSetup',
	controlCallback: ( { initialSetup } ) => {
		return set( 'core', 'user', 'initial-setup', {
			initialSetup,
		} );
	},
	reducerCallback: createReducer( ( state, initialSetup ) => {
		state.initialSetup = initialSetup;
	} ),
	argsToParams: ( initialSetup ) => {
		return { initialSetup };
	},
	validateParams: ( { initialSetup } ) => {
		invariant(
			isPlainObject( initialSetup ),
			'initialSetup must be a plain object.'
		);
	},
} );

const baseActions = {
	/**
	 * Saves the initial setup data.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} initialSetup The initial setup data.
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveInitialSetup( initialSetup ) {
		const { response, error } =
			yield fetchSaveInitialSetupStore.actions.fetchSaveInitialSetup(
				initialSetup
			);

		return { response, error };
	},
};

const baseControls = {};

const baseResolvers = {};

const baseSelectors = {};

const store = combineStores( fetchSaveInitialSetupStore, {
	initialState: {
		initialSetup: {},
	},
	actions: baseActions,
	controls: baseControls,
	reducer: createReducer( () => {} ),
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
