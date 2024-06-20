/**
 * `modules/analytics-4` data store: audience settings.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isEqual, isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

const { receiveError, clearError } = errorStoreActions;

const validateAudienceSettings = ( settings ) => {
	invariant(
		isPlainObject( settings ),
		'Audience settings should be an object.'
	);
	invariant(
		Array.isArray( settings.configuredAudiences ),
		'Configured audiences should be an array.'
	);
	invariant(
		typeof settings.isAudienceSegmentationWidgetHidden === 'boolean',
		'Audience segmentation widget visibility should be a boolean.'
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
		API.set( 'modules', 'analytics-4', 'audience-settings', { settings } ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: validateAudienceSettings,
} );

// Actions
const SET_CONFIGURED_AUDIENCES = 'SET_CONFIGURED_AUDIENCES';
const SET_AUDIENCE_SEGMENTATION_WIDGET_HIDDEN =
	'SET_AUDIENCE_SEGMENTATION_WIDGET_HIDDEN';

const baseInitialState = {
	audienceSettings: undefined,
};

const baseActions = {
	/**
	 * Saves the audience settings.
	 *
	 * @since 1.124.0
	 *
	 * @param {Object} settings Optional. By default, this saves whatever there is in the store. Use this object to save additional settings.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveAudienceSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'audience settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			yield clearError( 'saveAudienceSettings', [] );

			const registry = yield commonActions.getRegistry();
			const audienceSettings = yield commonActions.await(
				registry
					.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
					.getAudienceSettings()
			);

			const { response, error } =
				yield fetchSaveAudienceSettingsStore.actions.fetchSaveAudienceSettings(
					{
						...audienceSettings,
						...settings,
					}
				);

			if ( error ) {
				yield receiveError( error, 'saveAudienceSettings', [] );
			}

			return { response, error };
		}
	),

	/**
	 * Sets the configured audiences.
	 *
	 * @since 1.124.0
	 *
	 * @param {Array} audienceResourceNames Configured audience resource names.
	 * @return {Object} Redux-style action.
	 */
	setConfiguredAudiences( audienceResourceNames ) {
		invariant(
			Array.isArray( audienceResourceNames ),
			'Configured audiences should be an array.'
		);

		return {
			type: SET_CONFIGURED_AUDIENCES,
			payload: { audienceResourceNames },
		};
	},

	/**
	 * Sets the audience segmentation widget visibility.
	 *
	 * @since 1.124.0
	 *
	 * @param {boolean} isWidgetHidden Whether or not the audience segmentation widget is hidden.
	 * @return {Object} Redux-style action.
	 */
	setAudienceSegmentationWidgetHidden( isWidgetHidden ) {
		invariant(
			typeof isWidgetHidden === 'boolean',
			'Audience segmentation widget visibility should be a boolean.'
		);

		return {
			type: SET_AUDIENCE_SEGMENTATION_WIDGET_HIDDEN,
			payload: { isWidgetHidden },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_CONFIGURED_AUDIENCES: {
			const { audienceResourceNames } = payload;

			if ( ! state.audienceSettings ) {
				state.audienceSettings = {};
			}

			state.audienceSettings.settings = {
				...state.audienceSettings.settings,
				configuredAudiences: audienceResourceNames,
			};

			break;
		}

		case SET_AUDIENCE_SEGMENTATION_WIDGET_HIDDEN: {
			const { isWidgetHidden } = payload;

			if ( ! state.audienceSettings ) {
				state.audienceSettings = {};
			}

			state.audienceSettings.settings = {
				...state.audienceSettings.settings,
				isAudienceSegmentationWidgetHidden: isWidgetHidden,
			};

			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getAudienceSettings() {
		const registry = yield commonActions.getRegistry();

		const audienceSettings = registry
			.select( MODULES_ANALYTICS_4 )
			.getAudienceSettings();

		if ( audienceSettings === undefined ) {
			yield fetchGetAudienceSettingsStore.actions.fetchGetAudienceSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the audience settings.
	 *
	 * @since 1.124.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Audience settings; `undefined` if not loaded.
	 */
	getAudienceSettings( state ) {
		return state.audienceSettings?.settings;
	},

	/**
	 * Gets the configured audiences from the audience settings.
	 *
	 * @since 1.124.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} An array with configured audiences; `undefined` if not loaded.
	 */
	getConfiguredAudiences: createRegistrySelector( ( select ) => () => {
		const audienceSettings =
			select( MODULES_ANALYTICS_4 ).getAudienceSettings();

		return audienceSettings?.configuredAudiences;
	} ),

	/**
	 * Gets the audience segmentation widget visibility from the audience settings.
	 *
	 * @since 1.124.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Whether or not the audience segmentation widget is hidden; `undefined` if not loaded.
	 */
	isAudienceSegmentationWidgetHidden: createRegistrySelector(
		( select ) => () => {
			const audienceSettings =
				select( MODULES_ANALYTICS_4 ).getAudienceSettings();

			return audienceSettings?.isAudienceSegmentationWidgetHidden;
		}
	),

	/**
	 * Checks if the configured audiences have changed from the saved settings.
	 *
	 * @since 1.124.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if configured audiences have changed, otherwise false.
	 */
	haveConfiguredAudiencesChanged( state ) {
		const { settings, savedSettings } = state.audienceSettings || {};

		return ! isEqual(
			settings?.configuredAudiences,
			savedSettings?.configuredAudiences
		);
	},

	/**
	 * Determines whether the audience settings are being saved.
	 *
	 * @since 1.129.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the audience settings are being saved, otherwise FALSE.
	 */
	isSavingAudienceSettings( state ) {
		// Since `isFetchingSaveAudienceSettings` holds information based on specific
		// values but we only need generic information here, we need to check
		// whether ANY such request is in progress.
		return Object.values( state.isFetchingSaveAudienceSettings ).some(
			Boolean
		);
	},
};

const store = combineStores(
	fetchGetAudienceSettingsStore,
	fetchSaveAudienceSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
