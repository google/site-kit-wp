/**
 * PermissionsModal component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { snapshotAllStores } from '../../googlesitekit/data/create-snapshot-store';
import Dialog from '../Dialog';
import Portal from '../Portal';
const { useSelect, useDispatch, useRegistry } = Data;

const PermissionsModal = () => {
	const registry = useRegistry();
	const permissionsError = useSelect( ( select ) => select( CORE_USER ).getPermissionScopeError() );
	const connectURL = useSelect(
		( select ) => select( CORE_USER ).getConnectURL( {
			additionalScopes: permissionsError?.data?.scopes,
			redirectURL: global.location.href,
		} )
	);

	const { clearPermissionScopeError } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const onCancel = useCallback( () => {
		clearPermissionScopeError();
	}, [ clearPermissionScopeError ] );

	const onConfirm = useCallback( async () => {
		// If we have a datastores to snapshot before navigating away to the
		// authorization page, do that first.
		await snapshotAllStores( registry );
		navigateTo( connectURL );
	}, [ registry, connectURL, navigateTo ] );

	useEffect( () => {
		// If error has flag to skip the modal, redirect to the authorization
		// page immediately without prompting the user, essentially short-
		// circuiting to the confirm step.
		const confirmIfSkipModal = async () => {
			if ( permissionsError?.data?.skipModal && permissionsError?.data?.scopes?.length ) {
				await onConfirm();
			}
		};
		confirmIfSkipModal();
	}, [ onConfirm, permissionsError ] );

	if ( ! permissionsError ) {
		return null;
	}

	// If there aren't any scopes for us to request, there's no reason to show
	// the modal. Log a console warning if this happens and return `null`.
	if ( ! permissionsError?.data?.scopes?.length ) {
		global.console.warn( 'permissionsError lacks scopes array to use for redirect, so not showing the PermissionsModal. permissionsError was:', permissionsError );
		return null;
	}

	if ( permissionsError?.data?.skipModal ) {
		return null;
	}

	return (
		<Portal>
			<Dialog
				title={ __( 'Additional Permissions Required', 'google-site-kit' ) }
				subtitle={ permissionsError.message }
				confirmButton={ __( 'Proceed', 'google-site-kit' ) }
				dialogActive={ true }
				handleConfirm={ onConfirm }
				handleDialog={ onCancel }
			/>
		</Portal>
	);
};

export default PermissionsModal;
