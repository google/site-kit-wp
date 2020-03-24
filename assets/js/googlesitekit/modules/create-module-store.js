/**
 * Provides API functions to create a datastore for a module.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	createNotificationsStore,
} from 'assets/js/googlesitekit/data/create-notifications-store';
import {
	createSettingsStore,
} from 'assets/js/googlesitekit/data/create-settings-store';

/**
 * Creates a base store object for a Site Kit module.
 *
 * Every module that intends to register its own store must use this function
 * to get the base store. It can then combine the base module with its own
 * selectors and actions to individualize the store.
 *
 * The return object of this function also includes a `STORE_NAME` property,
 * the value of which must be used as the name when registering the store.
 *
 * @since n.e.x.t
 *
 * @param {string} slug                 Slug of the module that the store is for.
 * @param {Object} options              Optional. Options to consider for the store.
 * @param {number} options.storeName    Store name to use. Default is 'modules/{slug}'.
 * @param {Array}  options.settingSlugs If the module store should support settings, this needs to be
 *                                      a list of the slugs that are part of the module and handled
 *                                      by the module's 'modules/{slug}/data/settings' API endpoint.
 *                                      Default is undefined.
 * @param {Object} options.registry     Store registry that this store will be registered on. Default
 *                                      is the main Site Kit registry `googlesitekit.data`.
 * @return {Object} The base module store object, with additional `STORE_NAME` and
 *                  `INITIAL_STATE` properties.
 */
export const createModuleStore = ( slug, {
	storeName = undefined,
	settingSlugs = undefined,
} = {} ) => {
	invariant( slug, 'slug is required.' );

	const notificationsStore = createNotificationsStore( 'modules', slug, 'notifications', {
		storeName,
	} );

	const STORE_NAME = [ notificationsStore.STORE_NAME ];
	const INITIAL_STATE = [ notificationsStore.INITIAL_STATE ];

	const actions = [ notificationsStore.actions ];
	const controls = [ notificationsStore.controls ];
	const reducer = [ notificationsStore.reducer ];
	const resolvers = [ notificationsStore.resolvers ];
	const selectors = [ notificationsStore.selectors ];

	if ( 'undefined' !== typeof settingSlugs ) {
		const settingsStore = createSettingsStore( 'modules', slug, 'settings', {
			storeName,
			settingSlugs,
		} );

		STORE_NAME.push( settingsStore.STORE_NAME );
		INITIAL_STATE.push( settingsStore.INITIAL_STATE );
		actions.push( settingsStore.actions );
		controls.push( settingsStore.controls );
		reducer.push( settingsStore.reducer );
		resolvers.push( settingsStore.resolvers );
		selectors.push( settingsStore.selectors );
	}

	return {
		STORE_NAME: Data.collectName( ...STORE_NAME ),
		INITIAL_STATE: Data.collectState( ...INITIAL_STATE ),
		actions: Data.collectActions( ...actions ),
		controls: Data.collectControls( ...controls ),
		reducer: Data.collectReducers( ...reducer ),
		resolvers: Data.collectResolvers( ...resolvers ),
		selectors: Data.collectSelectors( ...selectors ),
	};
};
