/**
 * `modules/sign-in-with-google` data store: module data.
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
 * External dependencies.
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import {
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

function getModuleDataProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const moduleData =
			select( MODULES_SIGN_IN_WITH_GOOGLE ).getModuleData() || [];
		return moduleData[ propName ];
	} );
}

// Actions
const RECEIVE_MODULE_DATA = 'RECEIVE_MODULE_DATA';

export const initialState = {
	moduleData: {
		isWooCommerceActive: undefined,
		isWooCommerceRegistrationEnabled: undefined,
		existingClientID: undefined,
	},
};

export const actions = {
	/**
	 * Stores module data in the datastore.
	 *
	 * @since 1.146.0
	 * @private
	 *
	 * @param {Object} moduleData Module data object.
	 * @return {Object} Redux-style action.
	 */
	receiveModuleData( moduleData ) {
		invariant( moduleData, 'moduleData is required.' );

		return {
			payload: moduleData,
			type: RECEIVE_MODULE_DATA,
		};
	},
};

export const controls = {};

export const reducer = createReducer( ( state, action ) => {
	switch ( action.type ) {
		case RECEIVE_MODULE_DATA: {
			const {
				isWooCommerceActive,
				isWooCommerceRegistrationEnabled,
				existingClientID,
			} = action.payload;

			state.moduleData = {
				isWooCommerceActive,
				isWooCommerceRegistrationEnabled,
				existingClientID,
			};
			break;
		}

		default:
			break;
	}
} );

function* waitForModuleData() {
	const { resolveSelect } = yield commonActions.getRegistry();

	yield commonActions.await(
		resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE ).getModuleData()
	);
}

export const resolvers = {
	/**
	 * Resolves module data.
	 *
	 * @since 1.146.0
	 * @since 1.162.0 Updated to use centralized module data access.
	 */
	*getModuleData() {
		const registry = yield commonActions.getRegistry();

		const moduleData = yield commonActions.await(
			registry
				.resolveSelect( CORE_MODULES )
				.getModuleInlineData( MODULE_SLUG_SIGN_IN_WITH_GOOGLE )
		);

		if ( ! moduleData ) {
			return;
		}

		yield actions.receiveModuleData( moduleData );
	},
	getExistingClientID: waitForModuleData,
};

export const selectors = {
	/**
	 * Gets all site info from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since 1.146.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Module data.
	 */
	getModuleData( state ) {
		return state.moduleData;
	},

	/**
	 * Gets WooCommerce active status.
	 *
	 * @since 1.146.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean)} List of supported conversion events.
	 */
	getIsWooCommerceActive: getModuleDataProperty( 'isWooCommerceActive' ),

	/**
	 * Gets WooCommerce registration enabled value.
	 *
	 * @since 1.146.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean)} List of supported conversion events.
	 */
	getIsWooCommerceRegistrationEnabled: getModuleDataProperty(
		'isWooCommerceRegistrationEnabled'
	),

	/**
	 * Gets existing client ID from previous module connection.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Existing client ID string or undefined.
	 */
	getExistingClientID: getModuleDataProperty( 'existingClientID' ),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
