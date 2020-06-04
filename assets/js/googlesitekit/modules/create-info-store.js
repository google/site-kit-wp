/**
 * core/modules data store: info.
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
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../datastore/user/constants';

const { createRegistrySelector } = Data;

/**
 * Creates a store object that has selectors for managing site info.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string}  slug                  Slug of the module that the store is for.
 * @param {Object}  options               Options to consider for the store.
 * @param {number}  options.storeName     Store name to use.
 * @param {string}  options.adminPage     Store admin page. Default is 'googlesitekit-dashboard'.
 * @param {boolean} options.requiresSetup Store flag, for requires setup. Default is 'true'
 * @return {Object} The info store object.
 */
export const createInfoStore = ( slug, {
	storeName = undefined,
	adminPage = 'googlesitekit-dashboard',
	requiresSetup = true,
} = {} ) => {
	const STORE_NAME = storeName || `modules/${ slug }`;

	const INITIAL_STATE = {};
	const actions = {};
	const controls = {};
	const reducer = ( state ) => {
		return { ...state };
	};
	const resolvers = {};
	const selectors = {
		/**
		 * Returns admin screen URL.
		 *
		 * @since n.e.x.t
		 *
		 * @param {(Object|undefined)} queryArgs Query arguments to add to admin URL.
		 * @return {(string|undefined)} The admin screen URL.
		 */
		getAdminScreenURL: createRegistrySelector( ( select ) => ( queryArgs ) => {
			return select( CORE_SITE ).getAdminURL( adminPage, queryArgs );
		} ),

		/**
		 * Returns admin reauthentication URL.
		 *
		 * @since n.e.x.t
		 *
		 * @return {(string|undefined)} The admin reauthentication URL.
		 */
		getAdminReauthURL: createRegistrySelector( ( select ) => () => {
			const { needsReauthentication } = select( CORE_USER ).getAuthentication() || {};

			const noSetupQueryArgs = ! requiresSetup ? {
				notification: 'authentication_success',
				reAuth: undefined,
			} : {};

			if ( ! needsReauthentication ) {
				return select( STORE_NAME ).getAdminScreenURL( noSetupQueryArgs );
			}

			return select( STORE_NAME ).getAdminScreenURL();
		} ),
	};

	return {
		STORE_NAME,
		INITIAL_STATE,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};
