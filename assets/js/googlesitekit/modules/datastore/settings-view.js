/**
 * core/modules data store: settings-view.
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
import { SETTINGS_DISPLAY_MODES } from './constants';

const SET_SETTINGS_VIEW_CURRENT_MODULE = 'SET_SETTINGS_VIEW_CURRENT_MODULE';
const SET_SETTINGS_VIEW_IS_EDITING = 'SET_SETTINGS_VIEW_IS_EDITING';
const TOGGLE_SETTINGS_VIEW_MODULE_OPEN = 'TOGGLE_SETTINGS_VIEW_MODULE_OPEN';

export const INITIAL_STATE = {
	settingsView: {
		// Only one module is in focus at a time (view/edit)
		currentModule: '',
		// Is the current module being edited?
		isEditing: false,
	},
};

export const actions = {
	setSettingsViewCurrentModule( slug ) {
		invariant( typeof slug === 'string', 'slug must be a string' );
		return {
			payload: { slug },
			type: SET_SETTINGS_VIEW_CURRENT_MODULE,
		};
	},
	setSettingsViewIsEditing( isEditing ) {
		return {
			payload: { isEditing },
			type: SET_SETTINGS_VIEW_IS_EDITING,
		};
	},
	toggleSettingsViewModuleOpen( slug ) {
		invariant( typeof slug === 'string', 'slug must be a string' );
		return {
			payload: { slug },
			type: TOGGLE_SETTINGS_VIEW_MODULE_OPEN,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_SETTINGS_VIEW_CURRENT_MODULE:
			return {
				...state,
				settingsView: {
					...state.settingsView,
					currentModule: payload.slug,
					isEditing: false,
				},
			};
		case SET_SETTINGS_VIEW_IS_EDITING:
			const isEditing = !! payload.isEditing;
			return {
				...state,
				settingsView: {
					...state.settingsView,
					isEditing: isEditing ? !! state.settingsView.currentModule : false,
				},
			};
		case TOGGLE_SETTINGS_VIEW_MODULE_OPEN:
			return {
				...state,
				settingsView: {
					...state.settingsView,
					currentModule: state.settingsView.currentModule !== payload.slug ? payload.slug : '',
				},
			};
		default:
			return { ...state };
	}
};

export const resolvers = {};

export const selectors = {
	getSettingsViewCurrentModule( state ) {
		return state.settingsView.currentModule;
	},

	getSettingsViewModuleState( state, slug ) {
		const { EDIT, VIEW, CLOSED, LOCKED } = SETTINGS_DISPLAY_MODES;
		const { currentModule, isEditing } = state.settingsView;

		if ( currentModule !== slug ) {
			return isEditing ? LOCKED : CLOSED;
		}

		return isEditing ? EDIT : VIEW;
	},

	isSettingsViewEditing( state ) {
		return state.settingsView.isEditing;
	},

	isSettingsViewModuleOpen( state, slug ) {
		return state.settingsView.currentModule === slug;
	},

	isSettingsViewModuleEditing( state, slug ) {
		return selectors.getSettingsViewModuleState( state, slug ) === SETTINGS_DISPLAY_MODES.EDIT;
	},

	isSettingsViewModuleLocked( state, slug ) {
		return selectors.getSettingsViewCurrentModule( state ) !== slug && selectors.isSettingsViewEditing( state );
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
