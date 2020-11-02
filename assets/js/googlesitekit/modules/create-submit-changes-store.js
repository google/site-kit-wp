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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import API from 'googlesitekit-api';
import { TYPE_MODULES } from '../../components/data/constants';
import { invalidateCacheGroup } from '../../components/data/invalidate-cache-group';
import { createStateSelectors, createStrictSelect, createValidationSelector } from '../data/utils';
const { createRegistryControl } = Data;

// Invariant error messages.
export const INVARIANT_DOING_SUBMIT_CHANGES = 'cannot submit changes while submitting changes';
export const INVARIANT_SETTINGS_NOT_CHANGED = 'cannot submit changes if settings have not changed';

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
 * @param {string}   args.storeName                  Datastore slug.
 * @param {Function} [args.submitChanges]            Optional. Callback function to issue the submit changes request. Will be used inside the submit changes control.
 * @param {Function} [args.validateCanSubmitChanges] Optional. A helper function to validate that settings can be submitted.
 * @return {Object} Partial store object with properties 'actions', 'controls', 'reducer', 'resolvers', and 'selectors'.
 */
export function createSubmitChangesStore( {
	storeName,
	submitChanges = () => () => ( {} ),
	validateCanSubmitChanges = () => {},
} = {} ) {
	invariant( storeName, 'storeName is required.' );

	const initialState = {
		hasStartedSubmittingChanges: false,
		hasFinishedSubmittingChanges: false,
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
			const { dispatch } = yield Data.commonActions.getRegistry();
			dispatch( storeName ).clearError( 'submitChanges', [] );

			yield {
				type: START_SUBMIT_CHANGES,
				payload: {},
			};

			const result = yield {
				type: SUBMIT_CHANGES,
				payload: {},
			};

			if ( result.error ) {
				yield dispatch( storeName ).receiveError( result.error, 'submitChanges', [] );
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
					hasStartedSubmittingChanges: true,
					hasFinishedSubmittingChanges: false,
					isDoingSubmitChanges: true,
				};
			}

			case FINISH_SUBMIT_CHANGES: {
				return {
					...state,
					hasStartedSubmittingChanges: false,
					hasFinishedSubmittingChanges: true,
					isDoingSubmitChanges: false,
				};
			}

			default: {
				return state;
			}
		}
	};

	const controls = {
		[ SUBMIT_CHANGES ]: submitChanges,
	};

	const resolvers = {};

	const {
		safeSelector: canSubmitChanges,
		dangerousSelector: validateSubmitChanges,
	} = createValidationSelector( validateCanSubmitChanges );

	const selectors = {
		canSubmitChanges,
		validateSubmitChanges,
		...createStateSelectors( Object.keys( initialState ) ),
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

/**
 * Creates a default submitChanges control function.
 *
 * @since n.e.x.t
 *
 * @param {string} slug      Module slug.
 * @param {string} storeName Datastore slug.
 * @return {Function} Control function to submit changes.
 */
export function makeDefaultSubmitChanges( slug, storeName ) {
	return createRegistryControl( ( { select, dispatch } ) => async () => {
		if ( select( storeName ).haveSettingsChanged() ) {
			const { error } = await dispatch( storeName ).saveSettings();
			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', slug );

		// TODO: Remove once legacy dataAPI is no longer used.
		invalidateCacheGroup( TYPE_MODULES, slug );

		return {};
	} );
}

/**
 * Creates a default canSubmitChanges function.
 *
 * @since n.e.x.t
 *
 * @param {string} storeName Datastore slug.
 * @return {Function} A function to check if settings can be submitted.
 */
export function makeDefaultCanSubmitChanges( storeName ) {
	return ( select ) => {
		const strictSelect = createStrictSelect( select );
		const {
			haveSettingsChanged,
			isDoingSubmitChanges,
		} = strictSelect( storeName );

		invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
		invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	};
}
