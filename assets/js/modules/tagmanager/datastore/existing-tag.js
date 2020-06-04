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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { getExistingTag } from '../../../util/tag';
import { isValidContainerID } from '../util/validation';

const { createRegistrySelector } = Data;

// Actions
const FETCH_EXISTING_TAG = 'FETCH_EXISTING_TAG';
const START_FETCH_EXISTING_TAG = 'START_FETCH_EXISTING_TAG';
const FINISH_FETCH_EXISTING_TAG = 'FINISH_FETCH_EXISTING_TAG';
const CATCH_FETCH_EXISTING_TAG = 'CATCH_FETCH_EXISTING_TAG';

const FETCH_TAG_PERMISSION = 'FETCH_TAG_PERMISSION';
const START_FETCH_TAG_PERMISSION = 'START_FETCH_TAG_PERMISSION';
const FINISH_FETCH_TAG_PERMISSION = 'FINISH_FETCH_TAG_PERMISSION';
const CATCH_FETCH_TAG_PERMISSION = 'CATCH_FETCH_TAG_PERMISSION';

const RECEIVE_EXISTING_TAG = 'RECEIVE_EXISTING_TAG';
const RECEIVE_TAG_PERMISSION = 'RECEIVE_TAG_PERMISSION';

export const INITIAL_STATE = {
	existingTag: undefined,
	isFetchingExistingTag: false,
	isFetchingTagPermission: {},
	tagPermission: {},
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
	*fetchTagPermission( tag ) {
		let response, error;

		yield {
			payload: { tag },
			type: START_FETCH_TAG_PERMISSION,
		};

		try {
			response = yield {
				payload: { tag },
				type: FETCH_TAG_PERMISSION,
			};

			yield actions.receiveTagPermission( true, { tag } );

			yield {
				payload: { tag },
				type: FINISH_FETCH_TAG_PERMISSION,
			};
		} catch ( e ) {
			if ( e.code === 'tag_manager_existing_tag_permission' ) {
				response = e;
				yield actions.receiveTagPermission( false, { tag } );
				yield {
					payload: { tag },
					type: FINISH_FETCH_TAG_PERMISSION,
				};
			} else {
				error = e;
				yield {
					payload: { tag, error },
					type: CATCH_FETCH_TAG_PERMISSION,
				};
			}
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
	receiveTagPermission( permission, { tag } ) {
		invariant( typeof permission === 'boolean', 'permission can only be received as boolean.' );
		invariant( isValidContainerID( tag ), 'a valid tag is required to receive permission.' );

		return {
			payload: { permission, tag },
			type: RECEIVE_TAG_PERMISSION,
		};
	},
};

export const controls = {
	[ FETCH_EXISTING_TAG ]: () => {
		return getExistingTag( 'tagmanager' );
	},
	[ FETCH_TAG_PERMISSION ]: ( { payload: { tag } } ) => {
		return API.get( 'modules', 'tagmanager', 'tag-permission', { tag }, { useCache: false } );
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

		// FETCH TAG PERMISSION
		case START_FETCH_TAG_PERMISSION: {
			const { tag } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ tag ]: true,
				},
			};
		}

		case RECEIVE_TAG_PERMISSION: {
			const { tag, permission } = payload;

			return {
				...state,
				tagPermission: {
					...state.tagPermission,
					[ tag ]: permission,
				},
			};
		}

		case FINISH_FETCH_TAG_PERMISSION: {
			const { tag } = payload;

			return {
				...state,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ tag ]: false,
				},
			};
		}

		case CATCH_FETCH_TAG_PERMISSION: {
			const { error, tag } = payload;

			return {
				...state,
				error,
				isFetchingTagPermission: {
					...state.isFetchingTagPermission,
					[ tag ]: false,
				},
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
	*hasTagPermission( tag ) {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( STORE_NAME ).hasTagPermission( tag ) === undefined ) {
			yield actions.fetchTagPermission( tag );
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
	/**
	 * Checks whether the user has access to the given tag.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} tag Container publicId to check permission for.
	 * @return {(boolean|undefined)} Permission
	 */
	hasTagPermission( state, tag ) {
		const permission = state.tagPermission[ tag ];

		if ( permission === undefined ) {
			return undefined;
		}

		return !! permission;
	},
	/**
	 * Checks whether the user has access to the existing tag, if present.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)} true or false if tag permission is available,
	 *                    null if no existing tag,
	 *                    otherwise undefined if resolution is incomplete.
	 */
	hasExistingTagPermission: createRegistrySelector( ( select ) => () => {
		const hasExistingTag = select( STORE_NAME ).hasExistingTag();

		if ( hasExistingTag === undefined ) {
			return undefined;
		} else if ( hasExistingTag ) {
			const propertyID = select( STORE_NAME ).getExistingTag();

			return select( STORE_NAME ).hasTagPermission( propertyID );
		}

		return null;
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
