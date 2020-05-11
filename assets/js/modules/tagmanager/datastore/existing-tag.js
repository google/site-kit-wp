/**
 * modules/tagmanager data store: existing tag.
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
// import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { getExistingTag } from '../../../util/tag';
import isValidContainerID from '../util/validation';

const { createRegistrySelector } = Data;

// Actions
const FETCH_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const START_FETCH_EXISTING_TAG = 'START_FETCH_EXISTING_TAG';
const FINISH_FETCH_EXISTING_TAG = 'FINISH_FETCH_EXISTING_TAG';
const CATCH_FETCH_EXISTING_TAG = 'CATCH_FETCH_EXISTING_TAG';

const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';

export const INITIAL_STATE = {
	existingTag: undefined,
	isFetchingExistingTag: false,
};

export const actions = {
	*fetchExistingTag() {
		let response, error;

		yield {
			payload: {},
			type: START_FETCH_EXISTING_TAG,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_EXISTING_TAG,
			};

			yield actions.receiveExistingTag( response, {} );

			yield {
				payload: {},
				type: FINISH_FETCH_EXISTING_TAG,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_EXISTING_TAG,
			};
		}
		return { response, error };
	},
	receiveExistingTag( existingTag ) {
		invariant(
			existingTag === null || isValidContainerID( existingTag ),
			'existingTag must be a valid container public ID or null.'
		);

		return {
			payload: { existingTag },
			type: RECEIVE_EXISTING_TAG,
		};
	},
};

export const controls = {
	[ FETCH_EXISTING_TAG ]: () => {
		return getExistingTag( 'tagmanager' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: true,
			};
		}

		case RECEIVE_EXISTING_TAG: {
			const { existingTag } = payload;

			return {
				...state,
				existingTag,
			};
		}

		case FINISH_FETCH_EXISTING_TAG: {
			return {
				...state,
				isFetchingExistingTag: false,
			};
		}

		case CATCH_FETCH_EXISTING_TAG: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingExistingTag: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getExistingTag() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).getExistingTag() === undefined ) {
			yield actions.fetchExistingTag();
		}
	},
};

export const selectors = {
	/**
	 * Gets the existing tag, if any.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The existing tag ID if present, `null` if not present, or `undefined` if not loaded yet.
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

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
