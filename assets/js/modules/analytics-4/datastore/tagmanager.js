/**
 * `modules/analytics-4` data store: tagmanager.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';

const { createRegistrySelector } = Data;

const baseSelectors = {
	/**
	 * Determines whether the live container version has finished loading.
	 *
	 * @since n.e.x.t
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

const store = {
	selectors: baseSelectors,
};

export default store;
