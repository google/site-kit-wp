/**
 * Provides a datastore for getting existing tags
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import {
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from './create-fetch-store';
import { get } from 'googlesitekit-api';

/**
 * Creates a store object that includes actions and selectors for getting existing tags.
 *
 * @since 1.13.0
 * @private
 *
 * @param {Object}   args             Arguments for the store generation.
 * @param {string}   args.moduleSlug  Module slug to use.
 * @param {string}   args.storeName   Store name to use.
 * @param {Array}    args.tagMatchers The tag matchers used to extract tags from HTML.
 * @param {Function} args.isValidTag  Function to test whether a tag is valid or not.
 * @return {Object} The existing tag store object, with additional `STORE_NAME` and
 * initialState` properties.
 */
export const createExistingTagStore = ( {
	moduleSlug,
	storeName: STORE_NAME,
	isValidTag,
	tagMatchers,
} = {} ) => {
	invariant(
		'string' === typeof moduleSlug && moduleSlug,
		'moduleSlug is required.'
	);
	invariant(
		'string' === typeof STORE_NAME && STORE_NAME,
		'storeName is required.'
	);
	invariant(
		'function' === typeof isValidTag,
		'isValidTag must be a function.'
	);
	invariant( Array.isArray( tagMatchers ), 'tagMatchers must be an Array.' );

	const fetchGetExistingTagStore = createFetchStore( {
		baseName: 'getExistingTag',
		controlCallback: () => {
			return get( 'modules', moduleSlug, 'existing-tag', null, {
				useCache: false,
			} );
		},
		reducerCallback: createReducer( ( state, existingTag ) => {
			state.existingTag = existingTag;
		} ),
	} );

	const initialState = {
		existingTag: undefined,
	};

	const actions = {};

	const controls = {};

	const reducer = ( state ) => state;

	const resolvers = {
		*getExistingTag() {
			const registry = yield commonActions.getRegistry();

			if (
				registry.select( STORE_NAME ).getExistingTag() === undefined
			) {
				yield fetchGetExistingTagStore.actions.fetchGetExistingTag();
			}
		},
	};

	const selectors = {
		/**
		 * Gets the existing tag, if any.
		 *
		 * @since 1.13.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {(string|null|undefined)} The existing tag `string` if present, `null` if not present, or `undefined` if not loaded yet.
		 */
		getExistingTag( state ) {
			return state.existingTag;
		},

		/**
		 * Checks whether or not an existing tag is present.
		 *
		 * @since 1.13.0
		 *
		 * @return {(boolean|undefined)} Boolean if tag is present, `undefined` if tag presence has not been resolved yet.
		 */
		hasExistingTag: createRegistrySelector( ( select ) => () => {
			const existingTag = select( STORE_NAME ).getExistingTag();

			if ( existingTag === undefined ) {
				return undefined;
			}

			return !! existingTag;
		} ),
	};

	const store = combineStores( fetchGetExistingTagStore, {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	} );

	return {
		...store,
		STORE_NAME,
	};
};
