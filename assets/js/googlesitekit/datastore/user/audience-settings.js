/**
 * `core/user` data store: audience settings.
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
import { get, set } from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';
import { createReducer } from '../../data/create-reducer';
import { actions as errorStoreActions } from '../../data/create-error-store';
import { CORE_USER } from './constants';

const { receiveError, clearError } = errorStoreActions;

const validateUserAudienceSettings = ( settings ) => {
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

const fetchGetUserAudienceSettingsStore = createFetchStore( {
	baseName: 'getUserAudienceSettings',
	controlCallback() {
		return get(
			'core',
			'user',
			'audience-settings',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveUserAudienceSettingsStore = createFetchStore( {
	baseName: 'saveUserAudienceSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'user', 'audience-settings', { settings } ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: validateUserAudienceSettings,
} );

// Actions
const RESET_AUDIENCE_SETTINGS = 'RESET_AUDIENCE_SETTINGS';
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
	saveUserAudienceSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'audience settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			yield clearError( 'saveUserAudienceSettings', [] );

			const registry = yield commonActions.getRegistry();
			const audienceSettings = yield commonActions.await(
				registry.resolveSelect( CORE_USER ).getUserAudienceSettings()
			);
			const finalSettings = {
				...audienceSettings,
				...settings,
			};

			const availableAudiences = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getAvailableAudiences()
			);

			const sortedConfiguredAudiences = [
				...finalSettings.configuredAudiences,
			].sort( ( audienceNameA, audienceNameB ) => {
				const audienceIndexA = availableAudiences.findIndex(
					( audience ) => audience.name === audienceNameA
				);
				const audienceIndexB = availableAudiences.findIndex(
					( audience ) => audience.name === audienceNameB
				);

				if ( audienceIndexA === -1 || audienceIndexB === -1 ) {
					return 0;
				}

				return audienceIndexA - audienceIndexB;
			} );

			finalSettings.configuredAudiences = sortedConfiguredAudiences;

			const { response, error } =
				yield fetchSaveUserAudienceSettingsStore.actions.fetchSaveUserAudienceSettings(
					finalSettings
				);

			if ( error ) {
				yield receiveError( error, 'saveUserAudienceSettings', [] );
			}

			return { response, error };
		}
	),

	/**
	 * Resets the audience settings.
	 *
	 * @since 1.139.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetUserAudienceSettings() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_AUDIENCE_SETTINGS,
		};

		yield errorStoreActions.clearErrors( 'getUserAudienceSettings' );

		return dispatch( CORE_USER ).invalidateResolutionForStoreSelector(
			'getUserAudienceSettings'
		);
	},

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
		case RESET_AUDIENCE_SETTINGS: {
			state.audienceSettings = baseInitialState.audienceSettings;
			break;
		}

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
	*getUserAudienceSettings() {
		const registry = yield commonActions.getRegistry();

		const audienceSettings = registry
			.select( CORE_USER )
			.getUserAudienceSettings();

		if ( audienceSettings === undefined ) {
			yield fetchGetUserAudienceSettingsStore.actions.fetchGetUserAudienceSettings();
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
	getUserAudienceSettings( state ) {
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
		const audienceSettings = select( CORE_USER ).getUserAudienceSettings();

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
				select( CORE_USER ).getUserAudienceSettings();

			return audienceSettings?.isAudienceSegmentationWidgetHidden;
		}
	),

	/**
	 * Gets the `didSetAudiences` flag from the audience settings.
	 *
	 * @since 1.136.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} Whether or not the audience selection has ever been populated for the current user; `undefined` if not loaded.
	 */
	didSetAudiences: createRegistrySelector( ( select ) => () => {
		const audienceSettings = select( CORE_USER ).getUserAudienceSettings();

		return audienceSettings?.didSetAudiences;
	} ),

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
	isSavingUserAudienceSettings( state ) {
		// Since `isFetchingSaveUserAudienceSettings` holds information based on specific
		// values but we only need generic information here, we need to check
		// whether ANY such request is in progress.
		return Object.values( state.isFetchingSaveUserAudienceSettings ).some(
			Boolean
		);
	},
};

const store = combineStores(
	fetchGetUserAudienceSettingsStore,
	fetchSaveUserAudienceSettingsStore,
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
