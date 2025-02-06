/**
 * `modules/reader-revenue-manager` data store: service.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { createRegistrySelector } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

const selectors = {
	/**
	 * Returns a link to the Reader Revenue Manager platform.
	 *
	 * @since 1.132.0
	 * @since 1.136.0 Removed `publicationID` arg.
	 *
	 * @param {Object} state                Data store's state.
	 * @param {Object} [args]               Object containing optional publication ID, path and query args.
	 * @param {string} [args.publicationID] Publication ID to be used in the URL.
	 * @param {string} [args.path]          A path to append to the base url.
	 * @param {Object} [args.query]         Object of query params to be added to the URL.
	 * @return {(string|undefined)} The URL to the service, or `undefined` if not loaded.
	 */
	getServiceURL: createRegistrySelector(
		( select ) =>
			( state, { path, query } = {} ) => {
				let serviceURL = 'https://publishercenter.google.com';

				if ( path ) {
					const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
					serviceURL = `${ serviceURL }${ sanitizedPath }`;
				}

				serviceURL = addQueryArgs( serviceURL, {
					...query,
					utm_source: 'sitekit', // Always add the utm_source.
				} );

				const accountChooserBaseURI =
					select( CORE_USER ).getAccountChooserURL( serviceURL );

				if ( accountChooserBaseURI === undefined ) {
					return undefined;
				}

				return accountChooserBaseURI;
			}
	),

	/**
	 * Gets the details link URL for the module.
	 *
	 * @since 1.146.0
	 *
	 * @return {string} Details link URL.
	 */
	getDetailsLinkURL: createRegistrySelector( ( select ) => () => {
		const publicationID = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublicationID();

		return select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			path: 'reader-revenue-manager',
			query: {
				publication: publicationID,
			},
		} );
	} ),
};

const store = {
	selectors,
};

export default store;
