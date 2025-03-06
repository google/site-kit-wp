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

/**
 * Validates audience settings.
 *
 * @since 1.148.0
 *
 * @param {Object} audienceSettings Audience settings to validate.
 * @return {void}
 */
function validateAudienceSettings( audienceSettings ) {
	invariant(
		isPlainObject( audienceSettings ),
		'audienceSettings should be an object.'
	);
	invariant(
		Array.isArray( audienceSettings.availableAudiences ),
		'availableAudiences should be an array.'
	);
	invariant(
		typeof audienceSettings.audienceSegmentationSetupCompletedBy ===
			'number',
		'audienceSegmentationSetupCompletedBy should be an integer.'
	);
}

const fetchStoreReducerCallback = createReducer( ( state, settings ) => {
	if ( ! state.settings ) {
		state.settings = {};
	}

	state.settings.availableAudiences = settings?.availableAudiences;
	state.settings.audienceSegmentationSetupCompletedBy =
		settings?.audienceSegmentationSetupCompletedBy;
} );

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

const baseInitialState = {};

const baseActions = {
	/**
	 * Sets the available audiences.
	 *
	 * @since 1.148.0
	 *
	 * @param {Array} availableAudiences Available audience resource names.
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
	 * Sets the user who set up Audience Segmentation.
	 *
	 * @since 1.148.0
	 *
	 * @param {number} audienceSegmentationSetupCompletedBy ID for the user who set up Audience Segmentation.
	 * @return {Object} Redux-style action.
	 */
	setAudienceSegmentationSetupCompletedBy(
		audienceSegmentationSetupCompletedBy
	) {
		// Should be an integer.
		invariant(
			typeof audienceSegmentationSetupCompletedBy === 'number',
			'audienceSegmentationSetupCompletedBy by should be an integer.'
		);

		return {
			type: SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY,
			payload: { audienceSegmentationSetupCompletedBy },
		};
	},

	/**
	 * Saves the audience settings.
	 *
	 * @since 1.148.0
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

		const audiences = registry
			.select( MODULES_ANALYTICS_4 )
			.getAvailableAudiences();

		if ( audiences === undefined ) {
			registry.dispatch( MODULES_ANALYTICS_4 ).syncAvailableAudiences();
		}
	},

	*getAudienceSegmentationSetupCompletedBy() {
		const registry = yield commonActions.getRegistry();
		const { select } = registry;

		const audienceSegmentationSetupCompletedBy =
			select(
				MODULES_ANALYTICS_4
			).getAudienceSegmentationSetupCompletedBy();

		if ( audienceSegmentationSetupCompletedBy === undefined ) {
			yield fetchGetAudienceSettingsStore.actions.fetchGetAudienceSettings();
		}
	},
};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_AVAILABLE_AUDIENCES:
			const { availableAudiences } = payload;
			state.settings = {
				...state.settings,
				availableAudiences,
			};
			break;

		case SET_AUDIENCE_SEGMENTATION_SETUP_COMPLETED_BY:
			const { audienceSegmentationSetupCompletedBy } = payload;
			state.settings = {
				...state.settings,
				audienceSegmentationSetupCompletedBy,
			};
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the available audiences.
	 *
	 * @since 1.148.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|null)} Available audiences, or `undefined` if not loaded.
	 */
	getAvailableAudiences( state ) {
		return state.settings?.availableAudiences;
	},
	/**
	 * Gets the user who set up Audience Segmentation.
	 *
	 * @since 1.148.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|null)} ID for the user who set up Audience Segmentation, or `undefined` if not loaded.
	 */
	getAudienceSegmentationSetupCompletedBy( state ) {
		return state.settings?.audienceSegmentationSetupCompletedBy;
	},

	getAudienceSettings( state ) {
		return state.settings;
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
