/**
 * Provides a datastore for getting existing tags
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../datastore/site/constants';
import { getExistingTagURLs, extractExistingTag } from '../../util/tag';

const { createRegistryControl, createRegistrySelector } = Data;

// Actions
const FETCH_GET_EXISTING_TAG = 'FETCH_GET_EXISTING_TAG';
const RECEIVE_GET_EXISTING_TAG = 'RECEIVE_GET_EXISTING_TAG';
const WAIT_FOR_EXISTING_TAG = 'WAIT_FOR_EXISTING_TAG';

/**
 * Creates a store object that includes actions and selectors for getting existing tags.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string}   type                 The data to access. One of 'core' or 'modules'.
 * @param {string}   identifier           The data identifier, eg. a module slug like 'analytics'.
 * @param {Object}   options              Options to consider for the store.
 * @param {Array}    options.tagMatchers  The tag matchers used to extract tags from HTML.
 * @param {Function} [options.isValidTag] Optional. Function to detect whether a tag is valid or not.
 * @param {string}   [options.storeName]  Optional. Store name to use. Default is '{type}/{identifier}'.
 * @return {Object} The existing tag store object, with additional `STORE_NAME` and
 * INITIAL_STATE` properties.
 */
export const createExistingTagStore = ( type, identifier, {
	tagMatchers,
	isValidTag = ( tag ) => typeof tag === 'string' && tag.length > 0,
	storeName = undefined,
} = {} ) => {
	invariant( type, 'type is required.' );
	invariant( identifier, 'identifier is required.' );
	invariant( 'function' === typeof isValidTag, 'isValidTag must be a function.' );
	invariant( Array.isArray( tagMatchers ), 'tagMatchers must be an Array.' );

	const STORE_NAME = storeName || `${ type }/${ identifier }`;

	const INITIAL_STATE = {
		existingTag: undefined,
	};

	const actions = {
		fetchGetExistingTag() {
			return {
				payload: {},
				type: FETCH_GET_EXISTING_TAG,
			};
		},
		receiveGetExistingTag( existingTag ) {
			invariant(
				existingTag !== undefined && ( existingTag === null || isValidTag( existingTag ) ),
				'existingTag must be a valid tag or null.'
			);

			return {
				payload: { existingTag },
				type: RECEIVE_GET_EXISTING_TAG,
			};
		},
		*waitForExistingTag() {
			yield {
				payload: {},
				type: WAIT_FOR_EXISTING_TAG,
			};
		},
	};

	const controls = {
		[ FETCH_GET_EXISTING_TAG ]: createRegistryControl( ( registry ) => async () => {
			const homeURL = registry.select( CORE_SITE ).getHomeURL();
			const ampMode = registry.select( CORE_SITE ).getAMPMode();
			const existingTagURLs = await getExistingTagURLs( { homeURL, ampMode } );

			for ( const url of existingTagURLs ) {
				await registry.dispatch( CORE_SITE ).waitForHTMLForURL( url );
				const html = registry.select( CORE_SITE ).getHTMLForURL( url );
				const tagFound = extractExistingTag( html, tagMatchers );
				if ( tagFound ) {
					return tagFound;
				}
			}

			return null;
		} ),
		[ WAIT_FOR_EXISTING_TAG ]: createRegistryControl( ( registry ) => () => {
			const isExistingTagLoaded = () => registry.select( STORE_NAME ).getExistingTag() !== undefined;
			if ( isExistingTagLoaded() ) {
				return true;
			}

			return new Promise( ( resolve ) => {
				const unsubscribe = registry.subscribe( () => {
					if ( isExistingTagLoaded() ) {
						unsubscribe();
						resolve();
					}
				} );
			} );
		} ),
	};

	const reducer = ( state = INITIAL_STATE, { type, payload } ) => { // eslint-disable-line no-shadow
		switch ( type ) {
			case RECEIVE_GET_EXISTING_TAG: {
				const { existingTag } = payload;

				return {
					...state,
					existingTag,
				};
			}

			default: {
				return { ...state };
			}
		}
	};

	const resolvers = {
		*getExistingTag() {
			const registry = yield Data.commonActions.getRegistry();

			if ( registry.select( STORE_NAME ).getExistingTag() === undefined ) {
				const existingTag = yield actions.fetchGetExistingTag();
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingTag );
			}
		},
	};

	const selectors = {
		/**
		 * Gets the existing tag, if any.
		 *
		 * @since n.e.x.t
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
		 * @since n.e.x.t
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

	const store = {
		INITIAL_STATE,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};

	return {
		...store,
		STORE_NAME,
	};
};
