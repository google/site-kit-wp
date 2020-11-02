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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
const { createRegistrySelector } = Data;

// Actions
const SET_MODULE_SETTINGS_PANEL_STATE = 'SET_MODULE_SETTINGS_PANEL_STATE';

export const initialState = {
	panelState: {
		modules: {},
		editing: null,
	},
};

export const actions = {
	/**
	 * Sets the module settings panel state for a given module.
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
		case SET_MODULE_SETTINGS_PANEL_STATE: {
			const { slug, value } = payload;
			const panelState = { ...state.panelState };
			panelState.modules[ slug ] = value;
			if ( value === 'edit' ) {
				panelState.editing = slug;
			} else if ( panelState.editing === slug ) {
				panelState.editing = null;
				for ( const [ moduleSlug, moduleState ] of Object.entries( panelState.modules ) ) {
					if ( moduleState === 'edit' ) {
						// Set all other module panelStates to view if they were edit which would have given them derived state of locked.
						panelState.modules[ moduleSlug ] = 'view';
					}
				}
			}

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
	 * Gets the settings panel state for a given module.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} slug Slug for panelState.
	 * @return {string} Module's panelState as one of: 'view', 'edit', 'closed', 'locked' or null.
	 */
	getModuleSettingsPanelState: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		const isModuleActive = select( 'core/modules' ).isModuleActive( slug );

		// Return the panel state if we have it.
		if ( state.panelState.modules[ slug ] ) {
			if ( isModuleActive === false ) {
				// Module is no longer active so we return a default closed state for it.
				return 'closed';
			}
			const slugState = state.panelState.modules[ slug ];
			// If another module is being currently being edited, and we think ours is being edited, it should be locked.
			return slugState === 'edit' && state.panelState.editing !== slug && state.panelState.editing !== null ? 'locked' : slugState;
		}

		return isModuleActive === null ? null : 'closed';
	} ),

};

export default {
	actions,
	initialState,
	reducer,
	selectors,
};
