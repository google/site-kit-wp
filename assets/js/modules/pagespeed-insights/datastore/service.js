/**
 * `modules/pagespeed-insights` data store: service.
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
	getServiceURL: ( state, { path, query } = {} ) => {
		const baseURI = 'https://pagespeed.web.dev';
		if ( path ) {
			const sanitizedPath = ! path.match( /^\// ) ? `/${ path }` : path;
			return addQueryArgs( `${ baseURI }${ sanitizedPath }`, query );
		}
		return addQueryArgs( baseURI, query );
	},
};

const store = {
	selectors,
};

export default store;
