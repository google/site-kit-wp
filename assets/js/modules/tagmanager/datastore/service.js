/**
 * `modules/tagmanager` data store: service.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

export const selectors = {
	/**
	 * Gets a URL to the service.
	 *
	 * @since 1.14.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {Object} [args]       Object containing optional path and query args.
	 * @param {string} [args.path]  A path to append to the base url.
	 * @param {Object} [args.query] Object of query params to be added to the URL.
	 * @return {(string|undefined)} The URL to the service, or `undefined` if not loaded.
	 */
	getServiceURL: createRegistrySelector(
		( select ) =>
			( state, { path, query } = {} ) => {
				let serviceURL = 'https://tagmanager.google.com/';

				if ( query ) {
					serviceURL = addQueryArgs( serviceURL, query );
				}

				if ( path ) {
					const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
					serviceURL = `${ serviceURL }#${ sanitizedPath }`;
				}

				const accountChooserBaseURI =
					select( CORE_USER ).getAccountChooserURL( serviceURL );

				if ( accountChooserBaseURI === undefined ) {
					return undefined;
				}

				return accountChooserBaseURI;
			}
	),
};

const store = {
	selectors,
};

export default store;
