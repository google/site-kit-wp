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
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from './constants';
import { CORE_SITE } from '../../datastore/site/constants';

import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';

const { receiveError, clearError } = errorStoreActions;
const { createRegistrySelector } = Data;

const SET_KEY_METRICS_SETTING = 'SET_KEY_METRICS_SETTING';

const baseInitialState = {
	keyMetricsSettings: undefined,
};

const fetchGetKeyMetricsSettingsStore = createFetchStore( {
	baseName: 'getKeyMetricsSettings',
	controlCallback: () =>
		API.get( 'core', 'user', 'key-metrics', undefined, {
			// Never cache key metrics requests, we want them to be
			// up-to-date with what's in settings, and they don't
			// make requests to Google APIs so it's not a slow request.
			useCache: false,
		} ),
	reducerCallback: ( state, keyMetricsSettings ) => ( {
		...state,
		keyMetricsSettings,
	} ),
} );

const fetchSaveKeyMetricsSettingsStore = createFetchStore( {
	baseName: 'saveKeyMetricsSettings',
	controlCallback: ( settings ) =>
		API.set( 'core', 'user', 'key-metrics', { settings } ),
	reducerCallback: ( state, keyMetricsSettings ) => ( {
		...state,
		keyMetricsSettings,
	} ),
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant( isPlainObject( settings ), 'Settings should be an object.' );
	},
} );

const baseActions = {
	/**
	 * Sets key metrics setting.
	 *
	 * @since 1.103.0
	 *
	 * @param {string}         settingID Setting key.
	 * @param {Array.<string>} value     Setting value.
	 * @return {Object} Redux-style action.
	 */
	setKeyMetricsSetting( settingID, value ) {
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
	 * @since 1.103.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveKeyMetricsSettings() {
		yield clearError( 'saveKeyMetricsSettings', [] );

		const registry = yield Data.commonActions.getRegistry();
		const keyMetricsSettings = registry
			.select( CORE_USER )
			.getKeyMetricsSettings();
		const { response, error } =
			yield fetchSaveKeyMetricsSettingsStore.actions.fetchSaveKeyMetricsSettings(
				keyMetricsSettings
			);

		if ( error ) {
			// Store error manually since saveKeyMetrics signature differs from fetchSaveKeyMetricsStore.
			yield receiveError( error, 'saveKeyMetricsSettings', [] );
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
				keyMetricsSettings: {
					...state.keyMetricsSettings,
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
	*getKeyMetricsSettings() {
		const registry = yield Data.commonActions.getRegistry();
		const keyMetricsSettings = registry
			.select( CORE_USER )
			.getKeyMetricsSettings();

		if ( keyMetricsSettings ) {
			return;
		}

		yield fetchGetKeyMetricsSettingsStore.actions.fetchGetKeyMetricsSettings();
	},
};

const baseSelectors = {
	/**
	 * Gets currently selected key metrics based on either the user picked metrics or the answer based metrics.
	 *
	 * @since 1.103.0
	 *
	 * @return {Array<string>|undefined} An array of key metric slugs, or undefined while loading.
	 */
	getKeyMetrics: createRegistrySelector( ( select ) => () => {
		const userPickedMetrics = select( CORE_USER ).getUserPickedMetrics();

		if ( userPickedMetrics === undefined ) {
			return undefined;
		}

		if ( userPickedMetrics.length ) {
			return userPickedMetrics;
		}

		return select( CORE_USER ).getAnswerBasedMetrics();
	} ),

	/**
	 * Gets the Key Metric widget slugs based on the user input settings.
	 *
	 * @since 1.103.0
	 *
	 * @return {Array<string>|undefined} An array of Key Metric widget slugs, or undefined if the user input settings are not loaded.
	 */
	getAnswerBasedMetrics: createRegistrySelector( ( select ) => () => {
		const userInputSettings = select( CORE_USER ).getUserInputSettings();

		if ( userInputSettings === undefined ) {
			return undefined;
		}

		const purpose = userInputSettings?.purpose?.values?.[ 0 ];

		const hasProductPostType = () => {
			const postTypes = select( CORE_SITE ).getPostTypes();
			return postTypes.some( ( { slug } ) => slug === 'product' );
		};

		switch ( purpose ) {
			case 'publish_blog':
			case 'publish_news':
				return [
					KM_ANALYTICS_LOYAL_VISITORS,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				];
			case 'monetize_content':
				return [
					KM_ANALYTICS_POPULAR_CONTENT,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				];
			case 'sell_products_or_service':
				return [
					hasProductPostType()
						? KM_ANALYTICS_POPULAR_PRODUCTS
						: KM_ANALYTICS_POPULAR_CONTENT,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				];

			case 'share_portfolio':
				return [
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
				];
			default:
				return [];
		}
	} ),

	/**
	 * Gets the Key Metric widget slugs selected by the user.
	 *
	 * @since 1.103.0
	 *
	 * @return {Array<string>|undefined} An array of Key Metric widget slugs, or undefined if the key metrics settings are not loaded.
	 */
	getUserPickedMetrics: createRegistrySelector( ( select ) => () => {
		const keyMetricsSettings = select( CORE_USER ).getKeyMetricsSettings();

		if ( keyMetricsSettings === undefined ) {
			return undefined;
		}
		return keyMetricsSettings.widgetSlugs;
	} ),

	/**
	 * Gets whether an individual key metric identified by its slug is
	 * active or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} True if the key metric widget tile is active, false if it is not, or undefined if the key metrics settings are not loaded.
	 */
	isKeyMetricActive: createRegistrySelector(
		( select ) => ( state, widgetSlug ) => {
			const keyMetrics = select( CORE_USER ).getKeyMetrics();

			if ( keyMetrics === undefined ) {
				return undefined;
			}

			return keyMetrics.includes( widgetSlug );
		}
	),

	/**
	 * Gets whether the key metrics widget is hidden.
	 *
	 * @since 1.103.0
	 *
	 * @return {boolean|undefined} True if the key metrics widget is hidden, false if it is not, or undefined if the key metrics settings are not loaded.
	 */
	isKeyMetricsWidgetHidden: createRegistrySelector( ( select ) => () => {
		const keyMetricsSettings = select( CORE_USER ).getKeyMetricsSettings();

		if ( keyMetricsSettings === undefined ) {
			return undefined;
		}

		return keyMetricsSettings.isWidgetHidden;
	} ),

	/**
	 * Gets key metrics settings.
	 *
	 * @since 1.103.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Key metrics settings. Returns `undefined` if not loaded.
	 */
	getKeyMetricsSettings( state ) {
		return state.keyMetricsSettings;
	},
};

const store = Data.combineStores(
	fetchGetKeyMetricsSettingsStore,
	fetchSaveKeyMetricsSettingsStore,
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
