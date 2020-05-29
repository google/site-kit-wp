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
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

const { createRegistrySelector } = Data;

// Actions

export const INITIAL_STATE = {};
export const actions = {};
export const controls = {};
export const reducer = ( state ) => {
	return { ...state };
};
export const resolvers = {};
export const selectors = {
	/**
	 * Returns admin screen url.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} page Admin page.
	 * @return {string|undefined} The admin screen url.
	 */
	getAdminScreenURL: createRegistrySelector( ( select ) => ( page ) => {
		return select( CORE_SITE ).getAdminURL( page );
	} ),

	/**
	 * Returns admin reauth url.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} page Admin page
	 * @return {string} The admin reauth url.
	 */
	getAdminReauthURL: createRegistrySelector( ( select ) => ( page ) => {
		return select( CORE_SITE ).getAdminURL( page );
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
