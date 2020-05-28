/**
 * modules/analytics data store: permissions.
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
import { PROVISIONING_SCOPE } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';
const { createRegistrySelector } = Data;

export const INITIAL_STATE = {};

export const actions = {};

export const controls = {};

export const reducer = ( state ) => {
	return { ...state };
};

export const resolvers = {};

export const selectors = {

	/**
	 * Checks whether the current user has granted access to the scope for
	 * provisioning a Google Analytics account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} True if access granted, false if not;
	 *                               undefined if not loaded yet.
	 */
	hasProvisioningScope: createRegistrySelector( ( select ) => () => {
		const grantedScopes = select( CORE_USER ).getGrantedScopes();

		if ( undefined === grantedScopes ) {
			return undefined;
		}

		return grantedScopes.includes( PROVISIONING_SCOPE );
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
