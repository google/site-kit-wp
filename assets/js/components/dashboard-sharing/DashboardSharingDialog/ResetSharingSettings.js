/**
 * DashboardSharingSettingsButton component.
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
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import {
	RESET_SETTINGS_DIALOG,
	SETTINGS_DIALOG,
} from '../DashboardSharingSettings/constants';
import Link from '../../Link';
import Button from '../../Button';
import { DialogFooter } from '../../../material-components';
import Spinner from '../../Spinner';
const { useDispatch } = Data;

export default function ResetSharingSettings() {
	// TODO: Error handling.
	// eslint-disable-next-line no-unused-vars
	const [ errorNotice, setErrorNotice ] = useState( null );
	const [ isResetting, setIsResetting ] = useState( false );

	const { setValue } = useDispatch( CORE_UI );
	const { resetSharingSettings } = useDispatch( CORE_MODULES );

	const closeDialog = useCallback( () => {
		setValue( RESET_SETTINGS_DIALOG, false );
		setValue( SETTINGS_DIALOG, true );
	}, [ setValue ] );

	const onReset = useCallback( async () => {
		setErrorNotice( null );
		setIsResetting( true );

		const { error } = await resetSharingSettings();
		if ( error ) {
			setErrorNotice( error.message );
			return;
		}

		setIsResetting( false );

		setValue( RESET_SETTINGS_DIALOG, false );
	}, [ resetSharingSettings, setValue ] );

	return (
		<Fragment>
			<h2 className="mdc-dialog__title">
				{ __(
					'Reset Dashboard Sharing permissions',
					'google-site-kit'
				) }
			</h2>
			<p className="mdc-dialog__lead">
				{ __(
					'Reset viewing roles and view-only management roles for shared dashboard',
					'google-site-kit'
				) }
			</p>
			<DialogFooter>
				<Button onClick={ onReset } disabled={ isResetting }>
					{ __( 'Reset', 'google-site-kit' ) }
				</Button>
				<Spinner isSaving={ isResetting } />
				<Link
					className="googlesitekit-margin-left-auto mdc-dialog__cancel-button"
					onClick={ closeDialog }
					disabled={ isResetting }
				>
					{ __( 'Cancel', 'google-site-kit' ) }
				</Link>
			</DialogFooter>
		</Fragment>
	);
}
