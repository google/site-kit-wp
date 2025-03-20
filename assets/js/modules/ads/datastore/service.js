/**
 * `modules/ads` data store: service.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ADS } from './constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';

const selectors = {
	/**
	 * Overrides the details link URL for the module.
	 *
	 * @since n.e.x.t
	 *
	 * @return {string} Details link URL.
	 */
	getDetailsLinkURL: createRegistrySelector( ( select ) => () => {
		const accountOverviewURL =
			select( MODULES_ADS ).getAccountOverviewURL();

		if ( accountOverviewURL ) {
			return select( CORE_USER ).getAccountChooserURL(
				accountOverviewURL
			);
		}

		const module = select( CORE_MODULES ).getModule( 'ads' );

		if ( module === undefined ) {
			return undefined;
		}

		if ( module === null || ! module.homepage ) {
			return null;
		}

		return select( CORE_USER ).getAccountChooserURL( module.homepage );
	} ),
};

const store = {
	selectors,
};

export default store;
