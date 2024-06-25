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
	commonActions,
	createRegistryControl,
	createRegistrySelector,
} from 'googlesitekit-data';
import { CORE_SITE } from '../datastore/site/constants';
import { getExistingTagURLs, extractExistingTag } from '../../util/tag';

// Actions
const FETCH_GET_EXISTING_TAG = 'FETCH_GET_EXISTING_TAG';
const RECEIVE_GET_EXISTING_TAG = 'RECEIVE_GET_EXISTING_TAG';
const WAIT_FOR_EXISTING_TAG = 'WAIT_FOR_EXISTING_TAG';

/**
 * Creates a store object that includes actions and selectors for getting existing tags.
 *
 * @since 1.13.0
 * @private
 *
 * @param {Object}   args             Arguments for the store generation.
 * @param {string}   args.storeName   Store name to use.
 * @param {Array}    args.tagMatchers The tag matchers used to extract tags from HTML.
 * @param {Function} args.isValidTag  Function to test whether a tag is valid or not.
 * @return {Object} The existing tag store object, with additional `STORE_NAME` and
 * initialState` properties.
 */
export const createExistingTagStore = ( {
	storeName: STORE_NAME,
	isValidTag,
	tagMatchers,
} = {} ) => {
	invariant(
		'string' === typeof STORE_NAME && STORE_NAME,
		'storeName is required.'
	);
	invariant(
		'function' === typeof isValidTag,
		'isValidTag must be a function.'
	);
	invariant( Array.isArray( tagMatchers ), 'tagMatchers must be an Array.' );

	const initialState = {
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
				existingTag === null || 'string' === typeof existingTag,
				'existingTag must be a tag string or null.'
			);

			return {
				payload: {
					existingTag: isValidTag( existingTag ) ? existingTag : null,
				},
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
		[ FETCH_GET_EXISTING_TAG ]: createRegistryControl(
			( registry ) => async () => {
				const homeURL = registry.select( CORE_SITE ).getHomeURL();
				const ampMode = registry.select( CORE_SITE ).getAMPMode();
				const existingTagURLs = await getExistingTagURLs( {
					homeURL,
					ampMode,
				} );

				for ( const url of existingTagURLs ) {
					await registry
						.dispatch( CORE_SITE )
						.waitForHTMLForURL( url );
					const html = registry
						.select( CORE_SITE )
						.getHTMLForURL( url );
					const tagFound = extractExistingTag( html, tagMatchers );
					if ( tagFound ) {
						return tagFound;
					}
				}

				return null;
			}
		),
		[ WAIT_FOR_EXISTING_TAG ]: createRegistryControl(
			( registry ) => () => {
				const isExistingTagLoaded = () =>
					registry.select( STORE_NAME ).getExistingTag() !==
					undefined;
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
			}
		),
	};

	const reducer = ( state = initialState, { type, payload } ) => {
		switch ( type ) {
			case RECEIVE_GET_EXISTING_TAG: {
				const { existingTag } = payload;

				return {
					...state,
					existingTag,
				};
			}

			default: {
				return state;
			}
		}
	};

	const resolvers = {
		*getExistingTag() {
			const registry = yield commonActions.getRegistry();

			if (
				registry.select( STORE_NAME ).getExistingTag() === undefined
			) {
				const existingTag = yield actions.fetchGetExistingTag();
				registry
					.dispatch( STORE_NAME )
					.receiveGetExistingTag( existingTag );
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

	const store = {
		initialState,
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
