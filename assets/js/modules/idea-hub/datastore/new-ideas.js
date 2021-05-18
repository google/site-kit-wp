/**
 * `modules/idea-hub` data store: new-ideas.
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

const fetchGetNewIdeasStore = createFetchStore( {
	baseName: 'getNewIdeas',
	controlCallback: () => {
		return API.get( 'modules', 'idea-hub', 'new-ideas' );
	},
	reducerCallback: ( state, newIdeas ) => {
		return {
			...state,
			newIdeas,
		};
	},
} );

const baseInitialState = {
	newIdeas: undefined,
};

const baseResolvers = {
	*getNewIdeas( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const newIdeas = registry.select( STORE_NAME ).getNewIdeas( options );

		// If there are already ideas in state, don't make an API request.
		if ( newIdeas === undefined ) {
			yield fetchGetNewIdeasStore.actions.fetchGetNewIdeas();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets New Ideas from the Idea Hub.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting new ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of new ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getNewIdeas( state, options = {} ) {
		const { newIdeas } = state;

		if ( newIdeas === undefined ) {
			return undefined;
		}

		const offset = options?.offset || 0;
		const length = options.length ? offset + options.length : newIdeas.length;
		return ( 'offset' in options || 'length' in options ) ? newIdeas.slice( offset, length ) : newIdeas;
	},
};

const store = Data.combineStores(
	fetchGetNewIdeasStore,
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
