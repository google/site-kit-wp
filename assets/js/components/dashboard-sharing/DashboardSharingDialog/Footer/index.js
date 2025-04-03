/**
 * DashboardSharingSettings Footer component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	EDITING_USER_ROLE_SELECT_SLUG_KEY,
	RESET_SETTINGS_DIALOG,
	SETTINGS_DIALOG,
} from '../../DashboardSharingSettings/constants';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import Link from '../../../Link';
import Notice from './Notice';
import ErrorText from '../../../ErrorText';

export default function Footer( { closeDialog, openResetDialog } ) {
	const viewContext = useViewContext();

	const [ errorNotice, setErrorNotice ] = useState( null );
	const [ isResetting, setIsResetting ] = useState( false );

	const canSubmitSharingChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitSharingChanges()
	);
	const isSaving = useSelect( ( select ) =>
		select( CORE_MODULES ).isDoingSubmitSharingChanges()
	);
	const haveSharingSettingsChangedManagement = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsExpanded( 'management' )
	);
	const haveSharingSettingsChangedRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsExpanded( 'sharedRoles' )
	);
	const haveSharingSettingsUpdated = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsUpdated()
	);
	const settingsDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( SETTINGS_DIALOG )
	);
	const resetDialogOpen = useSelect(
		( select ) => !! select( CORE_UI ).getValue( RESET_SETTINGS_DIALOG )
	);

	const { resetSharingSettings, saveSharingSettings } =
		useDispatch( CORE_MODULES );
	const { setValue } = useDispatch( CORE_UI );

	const onApply = useCallback( async () => {
		setErrorNotice( null );

		const { error } = await saveSharingSettings();
		if ( error ) {
			setErrorNotice( error.message );
			return;
		}

		trackEvent( `${ viewContext }_sharing`, 'settings_confirm' );

		// Reset the state to enable modules in when not editing or saving.
		setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );

		closeDialog();
	}, [ viewContext, saveSharingSettings, setValue, closeDialog ] );

	const onReset = useCallback( async () => {
		setErrorNotice( null );
		setIsResetting( true );

		const { error } = await resetSharingSettings();
		if ( error ) {
			setErrorNotice( error.message );
			return;
		}

		setIsResetting( false );

		closeDialog();
	}, [ closeDialog, resetSharingSettings ] );

	const onCancel = useCallback( () => {
		trackEvent( `${ viewContext }_sharing`, 'settings_cancel' );
		closeDialog();
	}, [ closeDialog, viewContext ] );

	const showNotice =
		errorNotice ||
		haveSharingSettingsChangedManagement ||
		haveSharingSettingsChangedRoles;

	return (
		<div className="googlesitekit-dashboard-sharing-settings__footer">
			{ showNotice && (
				<div className="googlesitekit-dashboard-sharing-settings__footer-notice">
					{ errorNotice && <ErrorText message={ errorNotice } /> }
					{ ! errorNotice && <Notice /> }
				</div>
			) }

			<div className="googlesitekit-dashboard-sharing-settings__footer-actions">
				{ haveSharingSettingsUpdated &&
					settingsDialogOpen &&
					! showNotice && (
						<div className="googlesitekit-dashboard-sharing-settings__footer-actions-left">
							<Link
								onClick={ openResetDialog }
								danger
								className="googlesitekit-reset-sharing-permissions-button"
							>
								{ __(
									'Reset sharing permissions',
									'google-site-kit'
								) }
							</Link>
						</div>
					) }

				<div className="googlesitekit-dashboard-sharing-settings__footer-actions-right">
					<Button tertiary onClick={ onCancel }>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>

					{ settingsDialogOpen && (
						<SpinnerButton
							onClick={ onApply }
							disabled={ isSaving || ! canSubmitSharingChanges }
							isSaving={ isSaving }
						>
							{ __( 'Apply', 'google-site-kit' ) }
						</SpinnerButton>
					) }

					{ resetDialogOpen && (
						<SpinnerButton
							onClick={ onReset }
							disabled={ isResetting }
							isSaving={ isResetting }
							danger
						>
							{ __( 'Reset', 'google-site-kit' ) }
						</SpinnerButton>
					) }
				</div>
			</div>
		</div>
	);
}

Footer.propTypes = {
	closeDialog: PropTypes.func.isRequired,
	openResetDialog: PropTypes.func.isRequired,
};
