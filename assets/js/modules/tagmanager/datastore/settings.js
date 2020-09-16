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
 * External dependencies
 */
import invariant from 'invariant';

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
import { STORE_NAME as CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';

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
		try {
			validateCanSubmitChanges( select );
			return true;
		} catch {
			return false;
		}
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

/**
 * Validates whether changes can be submitted or not.
 *
 * If changes cannot be submitted, an appropriate error is thrown.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Function} select The current registry.select instance.
 */
export const validateCanSubmitChanges = ( select ) => {
	const strictSelect = createStrictSelect( select );
	// Strict select will cause all selector functions to throw an error
	// if `undefined` is returned, otherwise it behaves the same as `select`.
	// This ensures that the selector returns `false` until all data dependencies are resolved.
	const {
		getAccountID,
		getContainerID,
		getAMPContainerID,
		getInternalContainerID,
		getInternalAMPContainerID,
		getSingleAnalyticsPropertyID,
		hasAnyAnalyticsPropertyID,
		hasExistingTag,
		hasExistingTagPermission,
		hasMultipleAnalyticsPropertyIDs,
		haveSettingsChanged,
		isDoingSubmitChanges,
	} = strictSelect( STORE_NAME );
	const {
		isAMP,
		isSecondaryAMP,
	} = strictSelect( CORE_SITE );
	const { isModuleActive } = strictSelect( CORE_MODULES );
	const { getPropertyID } = strictSelect( MODULES_ANALYTICS );

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), 'cannot submit changes while submitting changes' );
	invariant( haveSettingsChanged(), 'cannot submit changes if settings have not changed' );
	invariant( isValidAccountID( getAccountID() ), 'a valid accountID is required to submit changes' );

	if ( isAMP() ) {
		// If AMP is active, the AMP container ID must be valid, regardless of mode.
		invariant( isValidContainerSelection( getAMPContainerID() ), 'a valid ampContainerID selection is required to submit changes' );
		// If AMP is active, and a valid AMP container ID is selected, the internal ID must also be valid.
		if ( isValidContainerID( getAMPContainerID() ) ) {
			invariant( isValidInternalContainerID( getInternalAMPContainerID() ), 'a valid internalAMPContainerID is required to submit changes' );
		}
	}

	if ( ! isAMP() || isSecondaryAMP() ) {
		// If AMP is not active, or in a secondary mode, validate the web container IDs.
		invariant( isValidContainerSelection( getContainerID() ), 'a valid containerID selection is required to submit changes' );
		// If a valid container ID is selected, the internal ID must also be valid.
		if ( isValidContainerID( getContainerID() ) ) {
			invariant( isValidInternalContainerID( getInternalContainerID() ), 'a valid internalContainerID is required to submit changes' );
		}
	}

	invariant( ! hasMultipleAnalyticsPropertyIDs(), 'containers with Analytics tags must reference a single property ID to submit changes' );

	if ( isModuleActive( 'analytics' ) && getPropertyID() && hasAnyAnalyticsPropertyID() ) {
		invariant( getSingleAnalyticsPropertyID() === getPropertyID(), 'single GTM Analytics property ID must match Analytics property ID' );
	}

	// Do existing tag check last.
	if ( hasExistingTag() ) {
		invariant( hasExistingTagPermission(), 'existing tag permission is required to submit changes' );
	}
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

