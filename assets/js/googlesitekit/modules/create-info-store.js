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

const { createRegistrySelector } = Data;

/**
 * Creates a store object that includes actions and selectors for managing notifications.
 *
 * The three required parameters hook up the store to the respective REST API endpoint.
 *
 * @since 1.6.0
 * @private
 *
 * @param {Object}  options               Options to consider for the store.
 * @param {number}  options.storeName     Store name to use. Default is '{type}/{identifier}'.
 * @param {string}  options.adminPage     Store admin page. Default is 'googlesitekit-dashboard'.
 * @param {boolean} options.requiresSetup Store flag for requires setup. Default is 'true'
 * @return {Object} The info store object, with additional `STORE_NAME` and
 *                  `INITIAL_STATE` properties.
 */
export const createInfoStore = ( {
	storeName = undefined,
	adminPage = undefined,
	// requiresSetup = undefined,
} = {} ) => {
	const STORE_NAME = storeName;

	const INITIAL_STATE = {};
	const actions = {};
	const controls = {};
	const reducer = ( state ) => {
		return { ...state };
	};
	const resolvers = {};
	const selectors = {
		/**
		 * Returns admin screen url.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} page Admin page.
		 * @return {string|undefined} The admin screen url.
		 */
		getAdminScreenURL: createRegistrySelector( ( select ) => ( state, queryArgs ) => {
			return select( CORE_SITE ).getAdminURL( adminPage, queryArgs );
		} ),

		/**
		 * Returns admin reauth url.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} page Admin page
		 * @return {string} The admin reauth url.
		 */
		getAdminReauthURL: createRegistrySelector( ( select ) => ( state, queryArgs ) => {
			return select( CORE_SITE ).getAdminURL( adminPage, queryArgs );
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
