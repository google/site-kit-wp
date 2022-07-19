/**
 * ResetSharingSettings component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Dialog from '../Dialog';
const { useSelect, useDispatch } = Data;

export const RESET_SHARING_DIALOG_OPEN = 'resetSharingDialogOpen';

export default function ResetSharingSettings( {} ) {
	// TODO: Error handling.
	// eslint-disable-next-line no-unused-vars
	const [ errorNotice, setErrorNotice ] = useState( null );

	const { setValue } = useDispatch( CORE_UI );
	const { resetSharingSettings } = useDispatch( CORE_MODULES );

	const isDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( RESET_SHARING_DIALOG_OPEN )
	);

	const closeDialog = useCallback( () => {
		setValue( RESET_SHARING_DIALOG_OPEN, false );
	}, [ setValue ] );

	const onReset = useCallback( async () => {
		setErrorNotice( null );

		const { error } = await resetSharingSettings();
		if ( error ) {
			setErrorNotice( error.message );
			return;
		}

		closeDialog();
	}, [ resetSharingSettings, closeDialog ] );

	return (
		<Dialog
			title={ __(
				'Reset Dashboard Sharing permissions',
				'google-site-kit'
			) }
			subtitle={ __(
				'Reset viewing roles and view-only management roles for shared dashboard',
				'google-site-kit'
			) }
			confirmButton={ __( 'Reset', 'google-site-kit' ) }
			dialogActive={ isDialogOpen }
			handleConfirm={ onReset }
			handleDialog={ closeDialog }
		/>
	);
}
