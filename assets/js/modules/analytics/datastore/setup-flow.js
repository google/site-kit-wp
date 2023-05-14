/**
 * `modules/analytics` data store: setup-flow.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_UA,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	ACCOUNT_CREATE,
	FORM_SETUP,
	SETUP_FLOW_MODE_GA4_LEGACY,
} from './constants';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { isFeatureEnabled } from '../../../features';

const { createRegistrySelector } = Data;

const baseSelectors = {
	/**
	 * Gets the setup flow mode based on different conditions.
	 *
	 * @since 1.37.0
	 *
	 * @return {string} Setup flow mode.
	 */
	getSetupFlowMode: createRegistrySelector( ( select ) => () => {
		// Ensure the Analytics settings have loaded. If we check
		// `select( MODULES_ANALYTICS ).getAccountID();` directly, it
		// could return `undefined` because the settings are loading OR
		// because accountID is not set. Ensuring the settings are loaded
		// means an `undefined` accountID is legitimate.
		// See: https://github.com/google/site-kit-wp/pull/3260#discussion_r623924928
		if ( select( MODULES_ANALYTICS ).getSettings() === undefined ) {
			return undefined;
		}

		if ( isFeatureEnabled( 'ga4Reporting' ) ) {
			return SETUP_FLOW_MODE_GA4;
		}

		const accountID = select( MODULES_ANALYTICS ).getAccountID();

		// If no accountID exists then no account is selected. This means we should
		// use the UA setup flow.
		if ( ! accountID || accountID === ACCOUNT_CREATE ) {
			return SETUP_FLOW_MODE_UA;
		}

		const ga4Properties =
			select( MODULES_ANALYTICS_4 ).getProperties( accountID );

		if ( ga4Properties === undefined ) {
			return undefined;
		}

		// If there are no GA4 properties available for this account, don't use
		// GA4 and use the UA version.
		if ( ga4Properties.length === 0 ) {
			return SETUP_FLOW_MODE_UA;
		}

		const uaProperties =
			select( MODULES_ANALYTICS ).getProperties( accountID );

		if ( uaProperties === undefined ) {
			return undefined;
		}

		// If no UA properties exist and there are GA4 properties, use GA4-only.
		if ( uaProperties.length === 0 ) {
			return SETUP_FLOW_MODE_GA4_LEGACY;
		}

		// There are UA and GA4 properties, so use the transitional mode.
		return SETUP_FLOW_MODE_GA4_TRANSITIONAL;
	} ),

	/**
	 * Determines whether GA4 controls should be displayed or not.
	 *
	 * @since 1.37.0
	 *
	 * @return {boolean} TRUE if we can use GA4 controls, otherwise FALSE.
	 */
	canUseGA4Controls: createRegistrySelector( ( select ) => () => {
		const enableGA4 = select( CORE_FORMS ).getValue(
			FORM_SETUP,
			'enableGA4'
		);

		if ( enableGA4 ) {
			return true;
		}

		const { isModuleConnected } = select( CORE_MODULES );
		const uaConnected = isModuleConnected( 'analytics' );
		const ga4Connected = isModuleConnected( 'analytics-4' );

		return uaConnected === ga4Connected;
	} ),

	/**
	 * Determines whether the live container version has finished loading.
	 *
	 * @since 1.94.0
	 *
	 * @return {boolean} TRUE if the GTM module is not available or the live container version has finished loading, otherwise FALSE.
	 */
	hasFinishedLoadingGTMContainers: createRegistrySelector(
		( select ) => () => {
			const tagmanagerModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'tagmanager' );
			if ( ! tagmanagerModuleConnected ) {
				return true;
			}

			const accountID = select( MODULES_TAGMANAGER ).getAccountID();
			const internalContainerID =
				select( MODULES_TAGMANAGER ).getInternalContainerID();
			const internalAMPContainerID =
				select( MODULES_TAGMANAGER ).getInternalAMPContainerID();

			return (
				select( MODULES_TAGMANAGER ).hasFinishedResolution(
					'getLiveContainerVersion',
					[ accountID, internalContainerID ]
				) ||
				select( MODULES_TAGMANAGER ).hasFinishedResolution(
					'getLiveContainerVersion',
					[ accountID, internalAMPContainerID ]
				)
			);
		}
	),
};

const store = Data.combineStores( {
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
