/**
 * modules/search-console data store
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
 * Wordpress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Modules from 'googlesitekit-modules';
import { STORE_NAME } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';
export { STORE_NAME };
const { createRegistrySelector } = Data;

const baseModuleStore = Modules.createModuleStore( 'search-console', {
	storeName: STORE_NAME,
	settingSlugs: [
		'propertyID',
	],
	adminPage: 'googlesitekit-module-search-console',
	requiresSetup: false,
} );

const baseSelectors = {
	/**
	 * Return the services base url.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [args]
	 * @param {string} [args.path]
	 * @param {Object} [args.query]
	 * @return {string}
	 */
	getServiceURL: createRegistrySelector( ( select ) => ( state, args = {} ) => {
		const { path, query } = args;
		const userEmail = select( CORE_USER ).getEmail();
		if ( userEmail === undefined ) {
			return undefined;
		}
		const baseURI = `https://search.google.com/search-console`;
		const queryArgs = { ...query, authuser: userEmail };
		if ( path ) {
			const sanitizedPath = ! path.match( /^\// ) ? `/${ path }` : path;
			return addQueryArgs( `${ baseURI }${ sanitizedPath }`, queryArgs );
		}
		return addQueryArgs( baseURI, queryArgs );
	} ),
};

const store = Data.combineStores(
	baseModuleStore,
	{
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

// Register this baseModuleStore on the global registry.
Data.registerStore( STORE_NAME, store );

export default baseModuleStore;
