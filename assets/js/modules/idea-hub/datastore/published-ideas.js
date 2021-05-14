/**
 * `modules/idea-hub` data store: published-ideas.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetPublishedIdeasStore = createFetchStore( {
	baseName: 'getPublishedIdeas',
	controlCallback: () => {
		return API.get( 'modules', 'idea-hub', 'published-post-ideas' );
	},
	reducerCallback: ( state, publishedIdeas ) => {
		return {
			...state,
			publishedIdeas,
		};
	},
} );

const baseInitialState = {
	publishedIdeas: [],
};

const baseResolvers = {
	*getPublishedIdeas( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const publishedIdeas = registry.select( STORE_NAME ).getPublishedIdeas( options );

		// If there are already published ideas in state, don't make an API request.
		if ( publishedIdeas.length ) {
			return;
		}

		yield fetchGetPublishedIdeasStore.actions.fetchGetPublishedIdeas();
	},
};

const baseSelectors = {
	/**
	 * Gets Published Ideas from the Idea Hub.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting published ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of published ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getPublishedIdeas( state, options = {} ) {
		const { publishedIdeas } = state;
		const offset = options?.offset || 0;
		const length = options.length ? offset + options.length : publishedIdeas.length;
		return ( 'offset' in options || 'length' in options ) ? publishedIdeas.slice( offset, length ) : publishedIdeas;
	},
};

const store = Data.combineStores(
	fetchGetPublishedIdeasStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
