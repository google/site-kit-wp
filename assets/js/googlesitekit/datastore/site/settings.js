/**
 * `core/site` data store: settings.
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
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
const { commonActions, combineStores } = Data;

const fetchGetShowAdminBarStore = createFetchStore( {
	baseName: 'getShowAdminBar',
	controlCallback: async () => API.get( 'core', 'site', 'show-admin-bar', undefined, { useCache: false } ),
	reducerCallback: ( state, showAdminBar ) => {
		return {
			...state,
			settings: {
				...state.settings,
				showAdminBar,
			},
		};
	},
} );

const fetchSetShowAdminBarStore = createFetchStore( {
	baseName: 'setShowAdminBar',
	controlCallback: ( { showAdminBar } ) => API.set( 'core', 'site', 'show-admin-bar', { showAdminBar } ),
	reducerCallback: ( state, showAdminBar ) => {
		return {
			...state,
			settings: {
				...state.settings,
				showAdminBar,
			},
		};
	},
	argsToParams( showAdminBar ) {
		return { showAdminBar };
	},
	validateParams( { showAdminBar } ) {
		invariant( typeof showAdminBar === 'boolean', 'showAdminBar must be of boolean type' );
	},
} );

const baseInitialState = {
	settings: {
		showAdminBar: undefined,
	},
};

const baseActions = {
	/**
	 * Sets showAdminBar setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} showAdminBar Whether to show or hide the admin bar.
	 * @return {Object} Object with `response` and `error`.
	 */
	*setShowAdminBar( showAdminBar ) {
		const { response, error } = yield fetchSetShowAdminBarStore.actions.fetchSetAdminBar( showAdminBar );
		return { response, error };
	},
};

const baseControls = {};

function baseReducer( state, { type } ) {
	switch ( type ) {
		default:
			return state;
	}
}

const baseResolvers = {
	*getShowAdminBar() {
		const { select } = yield commonActions.getRegistry();

		const showAdminBar = select( STORE_NAME ).getShowAdminBar();
		if ( showAdminBar === undefined ) {
			yield fetchGetShowAdminBarStore.actions.fetchGetShowAdminBar();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets showAdminBar setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} The showAdminBar setting if it has been already resolved, otherwise undefined.
	 */
	getShowAdminBar( state ) {
		return state.settings?.showAdminBar;
	},
};

const store = combineStores(
	fetchGetShowAdminBarStore,
	fetchSetShowAdminBarStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
