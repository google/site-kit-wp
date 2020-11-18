/**
 * API function to create submit changes store.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { actions as errorActions } from '../../googlesitekit/data/create-error-store';
import { createValidationSelector } from '../data/utils';
const { createRegistryControl } = Data;
const { clearError, receiveError } = errorActions;

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

/**
 * Creates a store object implementing the necessary infrastructure for submitting module settings.
 *
 * @since n.e.x.t
 *
 * @param {Object}   args                            Arguments for creating the submitChanges store.
 * @param {Function} [args.submitChanges]            Optional. Callback function to issue the submit changes request. Will be used inside the submit changes control.
 * @param {Function} [args.validateCanSubmitChanges] Optional. A helper function to validate that settings can be submitted.
 * @return {Object} Partial store object with properties 'actions', 'controls', 'reducer', 'resolvers', and 'selectors'.
 */
export function createSubmitChangesStore( {
	submitChanges = () => ( {} ),
	validateCanSubmitChanges = () => {},
} = {} ) {
	const initialState = {
		isDoingSubmitChanges: false,
	};

	const actions = {
		/**
		 * Submits all changes currently present in the client, persisting them on the server.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Empty object on success, object with `error` property on failure.
		 */
		*submitChanges() {
			yield clearError( 'submitChanges', [] );

			yield {
				type: START_SUBMIT_CHANGES,
				payload: {},
			};

			const result = yield {
				type: SUBMIT_CHANGES,
				payload: {},
			};

			if ( result?.error ) {
				yield receiveError( result.error, 'submitChanges', [] );
			}

			yield {
				type: FINISH_SUBMIT_CHANGES,
				payload: {},
			};

			return result;
		},
	};

	const reducer = ( state, { type } ) => {
		switch ( type ) {
			case START_SUBMIT_CHANGES: {
				return {
					...state,
					isDoingSubmitChanges: true,
				};
			}

			case FINISH_SUBMIT_CHANGES: {
				return {
					...state,
					isDoingSubmitChanges: false,
				};
			}

			default: {
				return state;
			}
		}
	};

	const controls = {
		[ SUBMIT_CHANGES ]: createRegistryControl( ( registry ) => ( ...args ) => submitChanges( registry, ...args ) ),
	};

	const resolvers = {};

	const {
		safeSelector: canSubmitChanges,
		dangerousSelector: __dangerousCanSubmitChanges,
	} = createValidationSelector( validateCanSubmitChanges );

	const selectors = {
		canSubmitChanges,
		__dangerousCanSubmitChanges,

		/**
		 * Checks whether changes are currently being submitted.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} TRUE if submitting, otherwise FALSE.
		 */
		isDoingSubmitChanges( state ) {
			return !! state.isDoingSubmitChanges;
		},
	};

	return {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
}
