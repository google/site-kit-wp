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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';
const { receiveError, clearError } = errorStoreActions;

const SET_KEY_METRICS_SETTING = 'SET_KEY_METRICS_SETTING';

const baseInitialState = {
	keyMetrics: undefined,
};

const fetchSaveKeyMetricsStore = createFetchStore( {
	baseName: 'saveKeyMetrics',
	controlCallback: ( settings ) =>
		API.set( 'core', 'user', 'key-metrics', { settings } ),
	reducerCallback: ( state, keyMetrics ) => ( { ...state, keyMetrics } ),
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant( isPlainObject( settings ), 'valid settings are required.' );
	},
} );

const baseActions = {
	/**
	 * Sets key metrics setting.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveKeyMetrics() {
		yield clearError( 'saveKeyMetrics', [] );

		const registry = yield Data.commonActions.getRegistry();
		const keyMetrics = registry.select( CORE_USER ).getKeyMetrics();
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

const baseResolvers = {};

const baseSelectors = {
	/**
	 * Gets key metrics selected by the user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Key metrics settings.
	 */
	getKeyMetrics( state ) {
		return state.keyMetrics;
	},
};

const store = Data.combineStores( fetchSaveKeyMetricsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
