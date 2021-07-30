/**
 * `core/modules` data store settings panel
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

// Actions
const SET_MODULE_SETTINGS_PANEL_STATE = 'SET_MODULE_SETTINGS_PANEL_STATE';

export const initialState = {
	settingsPanel: {
		currentModule: null,
		isEditing: false,
	},
};

export const actions = {
	/**
	 * Sets the module settings panel state for a given module.
	 *
	 * @since 1.22.0
	 *
	 * @param {string} slug  Module slug.
	 * @param {string} value New setting for module, one of: closed, edit, view.
	 * @return {Object} Action for SET_MODULE_SETTINGS_PANEL_STATE.
	 */
	setModuleSettingsPanelState( slug, value ) {
		invariant( slug, 'slug is required.' );
		const validValues = [ 'closed', 'edit', 'view' ];
		invariant(
			validValues.includes( value ),
			`value should be one of ${ validValues.join() } `
		);
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
			const settingsPanel = { ...state.settingsPanel };

			settingsPanel.currentModule = 'closed' === value ? null : slug;
			settingsPanel.isEditing = 'edit' === value;

			return {
				...state,
				settingsPanel,
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
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {string} Module settings panel state for a given module as one of: 'view', 'edit', or 'closed'.
	 */
	getModuleSettingsPanelState: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		const { currentModule, isEditing } = state.settingsPanel;

		if ( currentModule === slug ) {
			return isEditing ? 'edit' : 'view';
		}

		return 'closed';
	},

	/**
	 * Checks whether the module settings panel is open for a given module.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} Whether or not the module settings panel is open for the module.
	 */
	isModuleSettingsPanelOpen: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		return slug === state.settingsPanel.currentModule;
	},

	/**
	 * Checks whether the module settings panel is closed for a given module.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} Whether or not the module settings panel is closed for the module.
	 */
	isModuleSettingsPanelClosed: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		return slug !== state.settingsPanel.currentModule;
	},

	/**
	 * Checks whether the module settings panel is in edit state for a given module.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} Whether or not the module settings panel is in edit state for the module.
	 */
	isModuleSettingsPanelEdit: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		const { currentModule, isEditing } = state.settingsPanel;

		return slug === currentModule && isEditing;
	},

	/**
	 * Checks whether the module settings panel is locked for a given module.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Module slug.
	 * @return {boolean} Whether or not the module settings panel is locked for the module.
	 */
	isModuleSettingsPanelLocked: ( state, slug ) => {
		invariant( slug, 'slug is required.' );

		const { currentModule, isEditing } = state.settingsPanel;

		return slug !== currentModule && isEditing;
	},
};

export default {
	actions,
	initialState,
	reducer,
	selectors,
};
