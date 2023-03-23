/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import Data from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';
import { CORE_WIDGETS } from '../../widgets/datastore/constants';
const { receiveError, clearError } = errorStoreActions;
const { createRegistrySelector } = Data;

const SET_KEY_METRICS_SETTING = 'SET_KEY_METRICS_SETTING';

const baseInitialState = {
	keyMetrics: undefined,
};

const fetchGetUserPickedMetricsStore = createFetchStore( {
	baseName: 'getUserPickedMetrics',
	controlCallback: () =>
		API.get( 'core', 'user', 'key-metrics', undefined, {
			// Never cache key metrics requests, we want them to be
			// up-to-date with what's in settings, and they don't
			// make requests to Google APIs so it's not a slow request.
			useCache: false,
		} ),
	reducerCallback: ( state, keyMetrics ) => ( {
		...state,
		keyMetrics,
	} ),
} );

const fetchSaveKeyMetricsStore = createFetchStore( {
	baseName: 'saveKeyMetrics',
	controlCallback: ( settings ) =>
		API.set( 'core', 'user', 'key-metrics', { settings } ),
	reducerCallback: ( state, keyMetrics ) => ( { ...state, keyMetrics } ),
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant( isPlainObject( settings ), 'Settings should be an object.' );
	},
} );

const baseActions = {
	/**
	 * Sets key metrics setting.
	 *
	 * @since 1.94.0
	 *
	 * @param {string}         settingID Setting key.
	 * @param {Array.<string>} value     Setting value.
	 * @return {Object} Redux-style action.
	 */
	setKeyMetricSetting( settingID, value ) {
		return {
			type: SET_KEY_METRICS_SETTING,
			payload: {
				settingID,
				value,
			},
		};
	},

	/**
	 * Saves key metrics settings.
	 *
	 * @since 1.94.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveKeyMetrics() {
		yield clearError( 'saveKeyMetrics', [] );

		const registry = yield Data.commonActions.getRegistry();
		const keyMetrics = registry.select( CORE_USER ).getUserPickedMetrics();
		const { response, error } =
			yield fetchSaveKeyMetricsStore.actions.fetchSaveKeyMetrics(
				keyMetrics
			);

		if ( error ) {
			// Store error manually since saveKeyMetrics signature differs from fetchSaveKeyMetricsStore.
			yield receiveError( error, 'saveKeyMetrics', [] );
		}

		return { response, error };
	},
};

const baseControls = {};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_KEY_METRICS_SETTING: {
			return {
				...state,
				keyMetrics: {
					...state.keyMetrics,
					[ payload.settingID ]: payload.value,
				},
			};
		}
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getUserPickedMetrics() {
		const registry = yield Data.commonActions.getRegistry();
		const userPickedKeyMetrics = registry
			.select( CORE_USER )
			.getUserPickedMetrics();

		if ( userPickedKeyMetrics ) {
			return userPickedKeyMetrics;
		}

		yield fetchGetUserPickedMetricsStore.actions.fetchGetUserPickedMetrics();
	},
};

const baseSelectors = {
	/**
	 * Gets key metrics for this user, either from the user-selected
	 * key metrics selected by this user (if available) or—if the user has not
	 * manually selected their own key metrics—from the automatically-selected
	 * (eg. "answer-based") metrics based on their answers to our User Input
	 * questions.
	 *
	 * @since 1.96.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Key metrics settings.
	 */
	getKeyMetrics: createRegistrySelector( ( select ) => () => {
		const userPickedMetrics = select( CORE_USER ).getUserPickedMetrics();

		if ( userPickedMetrics === undefined ) {
			return undefined;
		}

		if ( userPickedMetrics?.widgetSlugs?.length ) {
			return userPickedMetrics.widgetSlugs;
		}

		return select( CORE_WIDGETS ).getAnswerBasedMetrics();
	} ),

	/**
	 * Gets key metrics selected by the user.
	 *
	 * @since 1.94.0 Initially introduced as `getKeyMetrics`.
	 * @since 1.96.0 Updated selector name now that `getKeyMetrics` contains more advanced logic.
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Key metrics settings.
	 */
	getUserPickedMetrics( state ) {
		return state.keyMetrics;
	},
};

const store = Data.combineStores(
	fetchGetUserPickedMetricsStore,
	fetchSaveKeyMetricsStore,
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
