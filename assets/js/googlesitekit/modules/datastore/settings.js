/**
 * `core/modules` data store settings
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
const { createRegistrySelector } = Data;

/**
 * External dependencies
 */
import invariant from 'invariant';

// Actions
const SET_MODULE_SETTINGS_PANEL_STATE = 'SET_MODULE_SETTINGS_PANEL_STATE';

export const initialState = {
	panelState: {},
};

export const actions = {
	/**
	 * Dispatches the module settings panel state action.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug  Slug for module.
	 * @param {string} value New setting for module, one of: closed, edit, view.
	 * @return {Object} Action for SET_MODULE_SETTINGS_PANEL_STATE.
	 */
	setModuleSettingsPanelState( slug, value ) {
		invariant( slug, 'slug is required.' );
		const validValues = [ 'closed', 'edit', 'view' ];
		invariant( validValues.includes( value ), `value should be one of ${ validValues.join() } ` );
		return {
			payload: {
				slug,
				value,
			},
			type: SET_MODULE_SETTINGS_PANEL_STATE,
		};
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		/**
		 * If the value is edit, all other module settings panels which currently have a status of view or edit should automatically be set to locked.
		 * If the value is closed or view AND previously the value was edit, all other module settings panels which currently have a status of locked should automatically be set to view.
		 */
		case SET_MODULE_SETTINGS_PANEL_STATE: {
			const { slug, value } = payload;
			const panelState = state.panelState;
			const previouslyEdit = panelState[ slug ] && panelState[ slug ] === 'edit' && [ 'closed', 'view' ].includes( value );
			Object.entries( panelState ).forEach(
				( [ stateKey, stateValue ] ) => {
					if ( [ 'view', 'edit' ].includes( stateValue ) && payload.value === 'edit' ) {
						panelState[ stateKey ] = 'locked';
					}
					if ( previouslyEdit && stateValue === 'locked' ) {
						panelState[ stateKey ] = 'view';
					}
				}
			);
			panelState[ slug ] = value;

			return {
				...state,
				panelState,
			};
		}

		default: {
			return state;
		}
	}
};

export const selectors = {
	/**
	 * Returns the moduleSettingsPanelState.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug Slug for panelState.
	 * @return {string} Module's panelState as one of: 'view', 'edit', 'closed', 'locked' or null.
	 */
	getModuleSettingsPanelState: createRegistrySelector( ( select ) => ( state, slug ) => {
		// Return the panel state if we have it.
		if ( state.panelState[ slug ] ) {
			return state.panelState[ slug ];
		}

		// Return closed as default state for a module.
		if ( select( 'core/modules' ).isModuleActive( slug ) !== null ) {
			return 'closed';
		}

		// Return null if we have no state for it and the module doesn't exist.
		return null;
	} ),

};

export default {
	actions,
	initialState,
	reducer,
	selectors,
};
