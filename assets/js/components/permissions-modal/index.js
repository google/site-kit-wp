/**
 * PermissionsModal component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_USER } from '../../googlesitekit/datastore/user';
import Dialog from '../dialog';
import Modal from '../modal';

const { useSelect, useDispatch } = Data;

const PermissionsModal = ( { dataStoreToSnapshot } ) => {
	const permissionsError = useSelect( ( select ) => select( CORE_USER ).getPermissionScopeError() );
	const additionalScopes = permissionsError?.data?.scopes;
	const connectURL = useSelect( ( select ) => select( CORE_USER ).getConnectURL( additionalScopes ) );
	const { clearPermissionScopeError } = useDispatch( CORE_USER );
	// TODO: This should come from the API response or a router, not a prop.
	const { takeSnapshot } = useDispatch( dataStoreToSnapshot );

	const onCancel = useCallback( () => {
		clearPermissionScopeError();
	}, [ clearPermissionScopeError ] );

	const onConfirm = useCallback( async () => {
		// If we have a datastores to snapshot before navigating away to the
		// authorization page, do that first.
		if ( dataStoreToSnapshot ) {
			await takeSnapshot();
		}

		global.location.assign( connectURL );
	}, [ dataStoreToSnapshot, connectURL ] );

	if ( ! permissionsError ) {
		return null;
	}

	// If there aren't any scopes for us to request, there's no reason to show
	// the modal. Log a console warning if this happens and return `null`.
	if ( permissionsError && permissionsError.data && permissionsError.data.scopes && permissionsError.data.scopes.length === 0 ) {
		global.console.warn( 'permissionsError lacks scopes array to use for redirect, so not showing the PermissionsModal. permissionsError was:', permissionsError );
		return null;
	}

	return (
		<Modal>
			<Dialog
				dialogActive={ true }
				handleConfirm={ onConfirm }
				handleDialog={ onCancel }
				title={ __( 'Additional Permissions Required', 'google-site-kit' ) }
				subtitle={ permissionsError.message }
				confirmButton={ __( 'Authorize additional permissions', 'google-site-kit' ) }
				provides={ [] }
			/>
		</Modal>
	);
};

export default PermissionsModal;
