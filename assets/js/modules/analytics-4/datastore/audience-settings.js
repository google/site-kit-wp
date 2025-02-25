/**
 * `modules/analytics-4` data store: audience settings.
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { commonActions, createReducer } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '../../../googlesitekit/data/utils';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

const { receiveError, clearError } = errorStoreActions;

const validateAudienceSettings = ( settings ) => {
	invariant(
		isPlainObject( settings ),
		'Audience settings should be an object.'
	);
	invariant(
		Array.isArray( settings.availableAudiences ),
		'Available audiences should be an array.'
	);
	invariant(
		typeof settings.audienceSegmentationSetupCompletedBy === 'number',
		'Audience segmentation setup completed by should be an integer.'
	);
};

const fetchStoreReducerCallback = createReducer(
	( state, audienceSettings ) => {
		if ( ! state.audienceSettings ) {
			state.audienceSettings = {};
		}

		state.audienceSettings.settings = audienceSettings;
		state.audienceSettings.savedSettings = audienceSettings;
	}
);

const fetchGetAudienceSettingsStore = createFetchStore( {
	baseName: 'getAudienceSettings',
	controlCallback() {
		return API.get(
			'modules',
			'analytics-4',
			'audience-settings',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveAudienceSettingsStore = createFetchStore( {
	baseName: 'saveAudienceSettings',
	controlCallback: ( settings ) =>
		API.set( 'modules', 'analytics-4', 'save-audience-settings', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: validateAudienceSettings,
} );

// Actions
const SET_AVAILABLE_AUDIENCES = 'SET_AVAILABLE_AUDIENCES';
const SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY =
	'SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY';

const baseInitialState = {
	audienceSettings: undefined,
};

const baseActions = {
	/**
	 * Sets the available audiences.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array} availableAudiences Available audiences resource names.
	 * @return {Object} Redux-style action.
	 */
	setAvailableAudiences( availableAudiences ) {
		invariant(
			Array.isArray( availableAudiences ),
			'Available audiences should be an array.'
		);

		return {
			type: SET_AVAILABLE_AUDIENCES,
			payload: { availableAudiences },
		};
	},

	/**
	 * Sets the audience segmentation setup completed by.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} audienceSegmentationSetupCompletedBy Audience segmentation setup completed by.
	 * @return {Object} Redux-style action.
	 */
	setAudienceSegmentationSetupCompletedBy(
		audienceSegmentationSetupCompletedBy
	) {
		// Should be integer.
		invariant(
			typeof audienceSegmentationSetupCompletedBy === 'number',
			'Audience segmentation setup completed by should be an integer.'
		);

		return {
			type: SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY,
			payload: { audienceSegmentationSetupCompletedBy },
		};
	},

	/**
	 * Saves the audience settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} settings Audience settings to save.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveAudienceSettings: createValidatedAction(
		( settings ) => {
			validateAudienceSettings( settings );
		},
		function* ( settings ) {
			yield clearError( 'saveAudienceSettings', [] );

			const { response, error } =
				yield fetchSaveAudienceSettingsStore.actions.fetchSaveAudienceSettings(
					settings
				);

			if ( error ) {
				yield receiveError( error, 'saveUserAudienceSettings', [] );
			}

			return { response, error };
		}
	),
};

const baseResolvers = {
	*getAvailableAudiences() {
		const registry = yield commonActions.getRegistry();
		const { select, dispatch } = registry;

		const audiences = select( MODULES_ANALYTICS_4 ).getAvailableAudiences();

		if ( audiences === null ) {
			const { response, error } = yield commonActions.await(
				dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences()
			);

			if ( error ) {
				return { error };
			}

			dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( response );
		}
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_AVAILABLE_AUDIENCES: {
			const { availableAudiences } = payload;

			return {
				...state,
				audienceSettings: {
					...state.audienceSettings,
					availableAudiences,
				},
			};
		}

		case SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY: {
			const { audienceSegmentationSetupCompletedBy } = payload;

			return {
				...state,
				audienceSettings: {
					...state.audienceSettings,
					audienceSegmentationSetupCompletedBy,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseSelectors = {
	/**
	 * Gets the available audiences.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|null)} Available audiences, or `null` if not loaded.
	 */
	getAvailableAudiences( state ) {
		return state.audienceSettings?.availableAudiences || null;
	},
	/**
	 * Gets the audience segmentation setup completed by.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|null)} Audience segmentation setup completed by, or `null` if not loaded.
	 */
	getAudienceSegmentationSetupCompletedBy( state ) {
		return (
			state.audienceSettings?.audienceSegmentationSetupCompletedBy || null
		);
	},

	getAudienceSettings( state ) {
		return state.audienceSettings;
	},
};

const store = combineStores(
	fetchGetAudienceSettingsStore,
	fetchSaveAudienceSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
		reducer: baseReducer,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
