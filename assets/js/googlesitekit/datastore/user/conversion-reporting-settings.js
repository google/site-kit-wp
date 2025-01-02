/**
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { createValidatedAction } from '../../data/utils';

const baseInitialState = {
	conversionReportingSettings: undefined,
};

const fetchGetConversionReportingSettingsStore = createFetchStore( {
	baseName: 'getConversionReportingSettings',
	controlCallback: () =>
		API.get( 'core', 'user', 'conversion-reporting-settings', undefined, {
			// Never cache conversion reporting settings requests, we want them to be
			// up-to-date with what's in settings, and they don't
			// make requests to Google APIs so it's not a slow request.
			useCache: false,
		} ),
	reducerCallback: ( state, conversionReportingSettings ) => ( {
		...state,
		conversionReportingSettings,
	} ),
} );

const fetchSaveConversionReportingSettingsStore = createFetchStore( {
	baseName: 'saveConversionReportingSettings',
	controlCallback: ( settings ) =>
		API.set( 'core', 'user', 'conversion-reporting-settings', {
			settings,
		} ),
	reducerCallback: ( state, conversionReportingSettings ) => ( {
		...state,
		conversionReportingSettings,
	} ),
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'Conversion reporting settings should be an object.'
		);
		if ( settings.newEventsCalloutDismissedAt ) {
			invariant(
				Number.isInteger( settings.newEventsCalloutDismissedAt ),
				'newEventsCalloutDismissedAt should be a timestamp.'
			);
		}
		if ( settings.lostEventsCalloutDismissedAt ) {
			invariant(
				Number.isInteger( settings.lostEventsCalloutDismissedAt ),
				'lostEventsCalloutDismissedAt should be an integer.'
			);
		}
	},
} );

const baseActions = {
	/**
	 * Saves the conversion reporting settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} settings Optional. By default, this saves whatever there is in the store. Use this object to save additional settings.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveConversionReportingSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'Conversion reporting settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			return yield fetchSaveConversionReportingSettingsStore.actions.fetchSaveConversionReportingSettings(
				settings
			);
		}
	),
};

const baseResolvers = {
	*getConversionReportingSettings() {
		const registry = yield commonActions.getRegistry();

		const conversionReportingSettings = registry
			.select( CORE_USER )
			.getConversionReportingSettings();

		if ( conversionReportingSettings === undefined ) {
			yield fetchGetConversionReportingSettingsStore.actions.fetchGetConversionReportingSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the conversion reporting settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Conversion reporting settings; `undefined` if not loaded.
	 */
	getConversionReportingSettings( state ) {
		return state.conversionReportingSettings;
	},

	/**
	 * Determines whether the conversion reporting settings are being saved or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the key metrics settings are being saved, otherwise FALSE.
	 */
	isSavingConversionReportingSettings( state ) {
		// Since isFetchingSaveConversionReportingSettings holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such request is in progress.
		return Object.values(
			state.isFetchingSaveConversionReportingSettings
		).some( Boolean );
	},

	/**
	 * Determines whether the new events callout should be shown or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} TRUE if the there were new events detected after the callout was dismissed, otherwise FALSE.
	 */
	haveNewConversionEventsAfterDismiss: createRegistrySelector(
		( select ) => ( state, newEventsLastSyncedAt ) => {
			const { getConversionReportingSettings } = select( CORE_USER );
			const conversionReportingSettings =
				getConversionReportingSettings();

			if ( ! conversionReportingSettings ) {
				return false;
			}

			if (
				newEventsLastSyncedAt >
				conversionReportingSettings.newEventsCalloutDismissedAt
			) {
				return true;
			}

			return false;
		}
	),

	/**
	 * Determines whether the lost events callout should be shown or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} TRUE if the there were lost events detected after the callout was dismissed, otherwise FALSE.
	 */
	haveLostConversionEventsAfterDismiss: createRegistrySelector(
		( select ) => ( state, lostEventsLastSyncedAt ) => {
			const { getConversionReportingSettings } = select( CORE_USER );
			const conversionReportingSettings =
				getConversionReportingSettings();

			if ( ! conversionReportingSettings ) {
				return false;
			}

			if (
				lostEventsLastSyncedAt >
				conversionReportingSettings.lostEventsCalloutDismissedAt
			) {
				return true;
			}

			return false;
		}
	),
};

const store = combineStores(
	fetchGetConversionReportingSettingsStore,
	fetchSaveConversionReportingSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
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
