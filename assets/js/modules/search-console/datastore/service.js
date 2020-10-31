/**
 * `modules/search-console` data store: service.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';

const { createRegistrySelector } = Data;

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
	 * @return {string} The URL to the service.
	 */
	getServiceURL: createRegistrySelector( ( select ) => ( state, { path, query } = {} ) => {
		const userEmail = select( CORE_USER ).getEmail();
		if ( userEmail === undefined ) {
			return undefined;
		}
		const baseURI = 'https://search.google.com/search-console';
		const queryArgs = { ...query, authuser: userEmail };
		if ( path ) {
			const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
			return addQueryArgs( `${ baseURI }${ sanitizedPath }`, queryArgs );
		}
		return addQueryArgs( baseURI, queryArgs );
	} ),

	/**
	 * Checks whether the Search Console property is a domain property.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean} True if the propertyID is a search console domain property, otherwise false.
	 */
	isDomainProperty: createRegistrySelector( ( select ) => () => {
		const domain = select( STORE_NAME ).getPropertyID();

		return domain && domain.startsWith( 'sc-domain:' );
	} ),
};

const store = {
	selectors,
};

export default store;
