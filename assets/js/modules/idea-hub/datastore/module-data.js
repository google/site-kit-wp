/**
 * Module-data data store
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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_IDEA_HUB } from './constants';

const { createRegistrySelector } = Data;

function getIdeaHubDataProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const ideaHubData = select( MODULES_IDEA_HUB ).getIdeaHubData() || {};
		return ideaHubData[ propName ];
	} );
}

const RECEIVE_IDEA_HUB_DATA = 'RECEIVE_IDEA_HUB_DATA';
const INCREMENT_INTERACTION_COUNT = 'INCREMENT_INTERACTION_COUNT';

const initialState = {
	ideaHubData: undefined,
};

export const actions = {
	/**
	 * Stores module data in the datastore.
	 *
	 * Because we need to keep track of changes (e.g. to the
	 * state of Idea Hub posts) from the back end, this data
	 * is sourced from a PHP-to-JS global `_googlesitekitIdeaHub`.
	 * For an example see `on_idea_hub_post_status_transition` in
	 * `includes/Modules/Idea_Hub.php`.
	 *
	 * @since 1.40.0
	 *
	 * @param {Object} ideaHubData Module data, via a PHP-to-JS global.
	 * @return {Object} Redux-style action.
	 */
	receiveIdeaHubData( ideaHubData ) {
		invariant( isPlainObject( ideaHubData ), 'Idea Hub data is required.' );
		return {
			payload: ideaHubData,
			type: RECEIVE_IDEA_HUB_DATA,
		};
	},

	/**
	 * Increments interactions count.
	 *
	 * @since 1.42.0
	 *
	 * @return {Object} Redux-style action.
	 */
	incrementInteractions() {
		return {
			type: INCREMENT_INTERACTION_COUNT,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_IDEA_HUB_DATA: {
			const { lastIdeaPostUpdatedAt, interactionCount } = payload;
			return {
				...state,
				ideaHubData: {
					lastIdeaPostUpdatedAt,
					interactionCount,
				},
			};
		}
		case INCREMENT_INTERACTION_COUNT: {
			const { ideaHubData = {} } = state;
			const interactionCount =
				parseInt( ideaHubData.interactionCount, 10 ) || 0;

			return {
				...state,
				ideaHubData: {
					...ideaHubData,
					interactionCount: interactionCount + 1,
				},
			};
		}
		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getIdeaHubData() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( MODULES_IDEA_HUB ).getIdeaHubData() !== undefined ) {
			return;
		}

		const { lastIdeaPostUpdatedAt, interactionCount } =
			global._googlesitekitIdeaHub || {};

		yield actions.receiveIdeaHubData( {
			lastIdeaPostUpdatedAt,
			interactionCount,
		} );
	},
};

export const selectors = {
	/**
	 * Gets all Idea Hub data.
	 *
	 * @since 1.40.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Idea Hub data object.
	 */
	getIdeaHubData( state ) {
		return state.ideaHubData;
	},

	/**
	 * Gets the timestamp of the last state update to an Idea Hub post.
	 *
	 * @since 1.40.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} Last updated timestamp.
	 */
	getLastIdeaPostUpdatedAt: getIdeaHubDataProperty( 'lastIdeaPostUpdatedAt' ),

	/**
	 * Gets the interaction count.
	 *
	 * @since 1.42.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {number} Interactions count.
	 */
	getInteractionCount: getIdeaHubDataProperty( 'interactionCount' ),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
