/**
 * modules/tagmanager data store: settings.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import {
	isValidAccountID,
	isValidContainerID,
	isValidInternalContainerID,
	isValidContainerSelection,
} from '../util/validation';
import { STORE_NAME, CONTAINER_CREATE, CONTEXT_WEB, CONTEXT_AMP } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

const { createRegistrySelector, createRegistryControl } = Data;

// Actions
const SUBMIT_CHANGES = 'SUBMIT_CHANGES';
const START_SUBMIT_CHANGES = 'START_SUBMIT_CHANGES';
const FINISH_SUBMIT_CHANGES = 'FINISH_SUBMIT_CHANGES';

export const INITIAL_STATE = {
	isDoingSubmitChanges: false,
};

export const actions = {
	/**
	 * Submits all changes currently present in the client, persisting them on the server.
	 *
	 * @since 1.11.0
	 *
	 * @return {Object} Empty object on success, object with `error` property on failure.
	 */
	*submitChanges() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: START_SUBMIT_CHANGES,
		};

		const result = yield {
			payload: {},
			type: SUBMIT_CHANGES,
		};

		if ( result.error ) {
			yield registry.dispatch( STORE_NAME ).receiveError( result.error, 'submitChanges', [] );
		}

		yield {
			payload: {},
			type: FINISH_SUBMIT_CHANGES,
		};

		return result;
	},
};

export const controls = {
	[ SUBMIT_CHANGES ]: createRegistryControl( ( { select, dispatch } ) => async () => {
		const accountID = select( STORE_NAME ).getAccountID();
		const containerID = select( STORE_NAME ).getContainerID();

		if ( containerID === CONTAINER_CREATE ) {
			const { response: container, error } = await dispatch( STORE_NAME ).createContainer( accountID, CONTEXT_WEB );

			if ( error ) {
				return { error };
			}

			await dispatch( STORE_NAME ).setContainerID( container.publicId ); // Capitalization rule exception: publicId
			await dispatch( STORE_NAME ).setInternalContainerID( container.containerId ); // Capitalization rule exception: containerId
		}

		const ampContainerID = select( STORE_NAME ).getAMPContainerID();

		if ( ampContainerID === CONTAINER_CREATE ) {
			const { response: container, error } = await dispatch( STORE_NAME ).createContainer( accountID, CONTEXT_AMP );

			if ( error ) {
				return { error };
			}

			await dispatch( STORE_NAME ).setAMPContainerID( container.publicId ); // Capitalization rule exception: publicId
			await dispatch( STORE_NAME ).setInternalAMPContainerID( container.containerId ); // Capitalization rule exception: containerId
		}

		// This action shouldn't be called if settings haven't changed,
		// but this prevents errors in tests.
		if ( select( STORE_NAME ).haveSettingsChanged() ) {
			const { error } = await dispatch( STORE_NAME ).saveSettings();

			if ( error ) {
				return { error };
			}
		}

		await API.invalidateCache( 'modules', 'tagmanager' );
		// TODO: Remove once legacy dataAPI is no longer used.
		invalidateCacheGroup( TYPE_MODULES, 'tagmanager' );

		return {};
	} ),
};

export const reducer = ( state, { type } ) => {
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

		default:
			return { ...state };
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Checks if changes can be submitted.
	 *
	 * @since 1.11.0
	 *
	 * @return {boolean} `true` if can submit changes, otherwise false.
	 */
	canSubmitChanges: createRegistrySelector( ( select ) => () => {
		const {
			getAccountID,
			getContainerID,
			getAMPContainerID,
			getInternalContainerID,
			getInternalAMPContainerID,
			hasExistingTagPermission,
			haveSettingsChanged,
			isDoingSubmitChanges,
		} = select( STORE_NAME );
		const {
			isAMP,
			isSecondaryAMP,
		} = select( CORE_SITE );

		if ( isDoingSubmitChanges() ) {
			return false;
		}
		if ( ! haveSettingsChanged() ) {
			return false;
		}
		if ( ! isValidAccountID( getAccountID() ) ) {
			return false;
		}
		// If AMP is active, the AMP container ID must be valid, regardless of mode.
		if ( isAMP() && ! isValidContainerSelection( getAMPContainerID() ) ) {
			return false;
		}
		// If AMP is active, and a valid AMP container ID is selected, the internal ID must also be valid.
		if ( isAMP() && isValidContainerID( getAMPContainerID() ) && ! isValidInternalContainerID( getInternalAMPContainerID() ) ) {
			return false;
		}
		// If AMP is not active, or in a secondary mode, validate the web container IDs.
		if ( ! isAMP() || isSecondaryAMP() ) {
			if ( ! isValidContainerSelection( getContainerID() ) ) {
				return false;
			}
			// If a valid container ID is selected, the internal ID must also be valid.
			if ( isValidContainerID( getContainerID() ) && ! isValidInternalContainerID( getInternalContainerID() ) ) {
				return false;
			}
		}
		// Do existing tag check last.
		if ( hasExistingTagPermission() === false ) {
			return false;
		}

		return true;
	} ),

	/**
	 * Checks whether changes are currently being submitted.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if submitting, `false` if not.
	 */
	isDoingSubmitChanges( state ) {
		return !! state.isDoingSubmitChanges;
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

