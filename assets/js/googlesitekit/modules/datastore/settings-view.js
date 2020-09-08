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

const SET_SETTINGS_VIEW_CURRENT_MODULE = 'SET_SETTINGS_VIEW_CURRENT_MODULE';
const SET_SETTINGS_VIEW_IS_EDITING = 'SET_SETTINGS_VIEW_IS_EDITING';

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
			return {
				...state,
				settingsView: {
					...state.settingsView,
					isEditing: !! payload.isEditing,
				},
			};
		default:
			return { ...state };
	}
};

export const resolvers = {};

export const selectors = {
	getCurrentSettingsViewModule( state ) {
		return state.settingsView.currentModule;
	},

	getSettingsViewModuleState( state, slug ) {
		const { currentModule, isEditing } = state.settingsView;

		if ( currentModule !== slug ) {
			return 'closed';
		}

		return isEditing ? 'edit' : 'view';
	},

	isSettingsViewEditing( state ) {
		return state.settingsView.isEditing;
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
