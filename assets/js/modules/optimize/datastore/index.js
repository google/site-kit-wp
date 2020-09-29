/**
 * modules/optimize data store
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Modules from 'googlesitekit-modules';
import { STORE_NAME } from './constants';
import settings from './settings';
import service from './service';

export { STORE_NAME };

let baseModuleStore = Modules.createModuleStore( 'optimize', {
	storeName: STORE_NAME,
	settingSlugs: [
		'ampExperimentJSON',
		'optimizeID',
		'ownerID',
	],
} );

// Rename generated pieces to adhere to our convention.
baseModuleStore = ( ( { actions, selectors, ...store } ) => {
	// eslint-disable-next-line sitekit/camelcase-acronyms
	const { setAmpExperimentJSON, ...restActions } = actions;
	// eslint-disable-next-line sitekit/camelcase-acronyms
	const { getAmpExperimentJSON, ...restSelectors } = selectors;

	return {
		...store,
		actions: {
			...restActions,
			// eslint-disable-next-line sitekit/camelcase-acronyms
			setAMPExperimentJSON: setAmpExperimentJSON,
		},
		selectors: {
			...restSelectors,
			// eslint-disable-next-line sitekit/camelcase-acronyms
			getAMPExperimentJSON: getAmpExperimentJSON,
		},
	};
} )( baseModuleStore );

const store = Data.combineStores(
	baseModuleStore,
	settings,
	service
);

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;
