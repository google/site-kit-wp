/**
 * `modules/tagmanager` data store: settings.
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
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { TYPE_MODULES } from '../../../components/data/constants';
import { invalidateCacheGroup } from '../../../components/data/invalidate-cache-group';
import {
	isValidAccountID,
	isValidContainerID,
	isValidInternalContainerID,
	isValidContainerSelection,
	isValidContainerName,
	isUniqueContainerName,
	getNormalizedContainerName,
} from '../util';
import { STORE_NAME, CONTAINER_CREATE, CONTEXT_WEB, CONTEXT_AMP, FORM_SETUP } from './constants';
import { INVARIANT_DOING_SUBMIT_CHANGES, INVARIANT_SETTINGS_NOT_CHANGED } from '../../../googlesitekit/data/create-settings-store';
import { STORE_NAME as CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { createStrictSelect } from '../../../googlesitekit/data/utils';

// Invariant error messages.
export const INVARIANT_INVALID_ACCOUNT_ID = 'a valid accountID is required to submit changes';
export const INVARIANT_INVALID_AMP_CONTAINER_SELECTION = 'a valid ampContainerID selection is required to submit changes';
export const INVARIANT_INVALID_AMP_INTERNAL_CONTAINER_ID = 'a valid internalAMPContainerID is required to submit changes';
export const INVARIANT_INVALID_CONTAINER_SELECTION = 'a valid containerID selection is required to submit changes';
export const INVARIANT_INVALID_INTERNAL_CONTAINER_ID = 'a valid internalContainerID is required to submit changes';
export const INVARIANT_INVALID_CONTAINER_NAME = 'a valid container name is required to submit changes';
export const INVARIANT_MULTIPLE_ANALYTICS_PROPERTY_IDS = 'containers with Analytics tags must reference a single property ID to submit changes';
export const INVARIANT_GTM_GA_PROPERTY_ID_MISMATCH = 'single GTM Analytics property ID must match Analytics property ID';
export const INVARIANT_INSUFFICIENT_EXISTING_TAG_PERMISSION = 'existing tag permission is required to submit changes';

export async function submitChanges( { select, dispatch } ) {
	const accountID = select( STORE_NAME ).getAccountID();
	const containerID = select( STORE_NAME ).getContainerID();

	if ( containerID === CONTAINER_CREATE ) {
		const containerName = select( CORE_FORMS ).getValue( FORM_SETUP, 'containerName' );
		const { response: container, error } = await dispatch( STORE_NAME ).createContainer( accountID, CONTEXT_WEB, { containerName } );

		if ( error ) {
			return { error };
		}

		await dispatch( STORE_NAME ).setContainerID( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
		await dispatch( STORE_NAME ).setInternalContainerID( container.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
	}

	const ampContainerID = select( STORE_NAME ).getAMPContainerID();

	if ( ampContainerID === CONTAINER_CREATE ) {
		const containerName = select( CORE_FORMS ).getValue( FORM_SETUP, 'ampContainerName' );
		const { response: container, error } = await dispatch( STORE_NAME ).createContainer( accountID, CONTEXT_AMP, { containerName } );

		if ( error ) {
			return { error };
		}

		await dispatch( STORE_NAME ).setAMPContainerID( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
		await dispatch( STORE_NAME ).setInternalAMPContainerID( container.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
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
}

export function validateCanSubmitChanges( select ) {
	const strictSelect = createStrictSelect( select );
	// Strict select will cause all selector functions to throw an error
	// if `undefined` is returned, otherwise it behaves the same as `select`.
	// This ensures that the selector returns `false` until all data dependencies are resolved.
	const {
		getAccountID,
		getContainerID,
		getContainers,
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

	const accountID = getAccountID();

	// Note: these error messages are referenced in test assertions.
	invariant( ! isDoingSubmitChanges(), INVARIANT_DOING_SUBMIT_CHANGES );
	invariant( haveSettingsChanged(), INVARIANT_SETTINGS_NOT_CHANGED );
	invariant( isValidAccountID( accountID ), INVARIANT_INVALID_ACCOUNT_ID );

	const containerID = getContainerID();
	if ( containerID === CONTAINER_CREATE ) {
		const containerName = select( CORE_FORMS ).getValue( FORM_SETUP, 'containerName' );
		invariant( isValidContainerName( containerName ), INVARIANT_INVALID_CONTAINER_NAME );

		const containers = getContainers( accountID );
		const normalizedContainerName = getNormalizedContainerName( containerName );
		invariant( isUniqueContainerName( containerName, containers ), `a container with "${ normalizedContainerName }" name already exists` );
	}

	if ( isAMP() ) {
		const ampContainerID = getAMPContainerID();

		// If AMP is active, the AMP container ID must be valid, regardless of mode.
		invariant( isValidContainerSelection( ampContainerID ), INVARIANT_INVALID_AMP_CONTAINER_SELECTION );
		// If AMP is active, and a valid AMP container ID is selected, the internal ID must also be valid.
		if ( isValidContainerID( ampContainerID ) ) {
			invariant( isValidInternalContainerID( getInternalAMPContainerID() ), INVARIANT_INVALID_AMP_INTERNAL_CONTAINER_ID );
		}

		if ( ampContainerID === CONTAINER_CREATE ) {
			const ampContainerName = select( CORE_FORMS ).getValue( FORM_SETUP, 'ampContainerName' );
			invariant( isValidContainerName( ampContainerName ), INVARIANT_INVALID_CONTAINER_NAME );

			const containers = getContainers( accountID );
			const normalizedContainerName = getNormalizedContainerName( ampContainerName );
			invariant( isUniqueContainerName( ampContainerName, containers ), `an AMP container with "${ normalizedContainerName }" name already exists` );
		}
	}

	if ( ! isAMP() || isSecondaryAMP() ) {
		// If AMP is not active, or in a secondary mode, validate the web container IDs.
		invariant( isValidContainerSelection( getContainerID() ), INVARIANT_INVALID_CONTAINER_SELECTION );
		// If a valid container ID is selected, the internal ID must also be valid.
		if ( isValidContainerID( getContainerID() ) ) {
			invariant( isValidInternalContainerID( getInternalContainerID() ), INVARIANT_INVALID_INTERNAL_CONTAINER_ID );
		}
	}

	invariant( ! hasMultipleAnalyticsPropertyIDs(), INVARIANT_MULTIPLE_ANALYTICS_PROPERTY_IDS );

	if ( isModuleActive( 'analytics' ) && getPropertyID() && hasAnyAnalyticsPropertyID() ) {
		invariant( getSingleAnalyticsPropertyID() === getPropertyID(), INVARIANT_GTM_GA_PROPERTY_ID_MISMATCH );
	}

	// Do existing tag check last.
	if ( hasExistingTag() ) {
		invariant( hasExistingTagPermission(), INVARIANT_INSUFFICIENT_EXISTING_TAG_PERMISSION );
	}
}
