/**
 * `core/site` data store: Error info.
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
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';

// Actions
const SET_SERVER_ERROR = 'SET_SERVER_ERROR';
const CLEAR_SERVER_ERROR = 'CLEAR_SERVER_ERROR';

const baseInitialState = {
	internalServerError: undefined,
};

const baseActions = {
	/**
	 * Sets the internal server error.
	 *
	 * @since 1.38.0
	 *
	 * @param {Object} error             Internal server error object.
	 * @param {string} error.id          Error notification ID.
	 * @param {string} [error.title]     Optional. Error notification title. Default is "Internal Server Error".
	 * @param {string} error.description Error notification message.
	 * @param {string} [error.format]    Optional. Error notification format. Valid values "small" and "large". Default is "small".
	 * @param {string} [error.type]      Optional. Error notification type. Valid values "win-warning" and "win-error". Default is "win-error".
	 * @return {Object} Redux-style action.
	 */
	setInternalServerError( error ) {
		invariant(
			isPlainObject( error ),
			'internalServerError must be a plain object.'
		);

		const {
			title = __( 'Internal Server Error', 'google-site-kit' ),
			format = 'small',
			type = 'win-error',
			...props
		} = error;

		return {
			type: SET_SERVER_ERROR,
			payload: {
				internalServerError: {
					title,
					format,
					type,
					...props,
				},
			},
		};
	},

	/**
	 * Clears the internal server error, if one was previously set.
	 *
	 * @since 1.38.0
	 *
	 * @return {Object} Redux-style action.
	 */
	clearInternalServerError() {
		return {
			type: CLEAR_SERVER_ERROR,
		};
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_SERVER_ERROR: {
			return {
				...state,
				internalServerError: payload.internalServerError,
			};
		}

		case CLEAR_SERVER_ERROR: {
			return {
				...state,
				internalServerError: undefined,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {};

const baseSelectors = {
	/**
	 * Gets the internal server error.
	 *
	 * @since 1.38.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Error info.
	 */
	getInternalServerError( state ) {
		return state.internalServerError;
	},
};

const store = Data.combineStores( {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
