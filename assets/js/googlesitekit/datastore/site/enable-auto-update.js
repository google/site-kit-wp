/**
 * `core/site` data store: enable-autp-update.
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
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const { createRegistrySelector } = Data;

const fetchEnableAutoUpdateStore = createFetchStore( {
	baseName: 'enableAutoUpdate',
	controlCallback: ( { nonce } ) => {
		const data = new FormData();
		data.append( 'action', 'toggle-auto-updates' );
		data.append( '_ajax_nonce', nonce );
		data.append( 'state', 'enable' );
		data.append( 'type', 'plugin' );
		data.append( 'asset', 'google-site-kit/google-site-kit.php' );

		return fetch( global.ajaxurl, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		} ).then( ( response ) => response.json() );
	},
	argsToParams: ( { nonce } ) => {
		return {
			nonce,
		};
	},
	validateParams: ( { nonce } ) => {
		invariant( typeof nonce === 'string', 'nonce is required.' );
	},
} );

const baseInitialState = {};

const baseActions = {
	/**
	 * Enables auto updates for Site Kit.
	 *
	 * WARNING: This causes the website's connection with Google Site Kit to be
	 * removed and will require re-authentication. Use this action with caution,
	 * and always request user confirmation before dispatching.
	 *
	 * @since n.e.x.t
	 */
	*enableAutoUpdate() {
		const registry = yield Data.commonActions.getRegistry();

		const nonce = registry.select( CORE_SITE ).getUpdatePluginNonce();

		yield fetchEnableAutoUpdateStore.actions.fetchEnableAutoUpdate( {
			nonce,
		} );
	},
};

const baseSelectors = {
	/**
	 * Checks if enableAutoUpdate action is in-process.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} `true` if enableAutoUpdateting is in-flight; `false` if not.
	 */
	isDoingEnableAutoUpdate: createRegistrySelector( ( select ) => () => {
		return select( CORE_SITE ).isFetchingEnableAutoUpdate();
	} ),
};

const store = Data.combineStores( fetchEnableAutoUpdateStore, {
	initialState: baseInitialState,
	actions: baseActions,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
