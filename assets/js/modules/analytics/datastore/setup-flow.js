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
import { SETUP_FLOW_MODE_GA4, FORM_SETUP } from './constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';

const { createRegistrySelector } = Data;

const baseSelectors = {
	/**
	 * Gets the setup flow mode.
	 *
	 * @since 1.37.0
	 * @since 1.114.0 Return only GA4 mode since removal of the `ga4Reporting` feature flag.
	 *
	 * @return {string} Setup flow mode.
	 */
	getSetupFlowMode: () => {
		return SETUP_FLOW_MODE_GA4;
	},

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
