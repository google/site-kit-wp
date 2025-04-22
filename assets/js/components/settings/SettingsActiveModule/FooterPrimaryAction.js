/**
 * FooterPrimaryAction component for SettingsActiveModule.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, SpinnerButton } from 'googlesitekit-components';
import Link from '../../Link';
import PencilIcon from '../../../../svg/icons/pencil.svg';

export default function FooterPrimaryAction( {
	isEditing,
	isSaving,
	hasSettings,
	moduleConnected,
	areSettingsEditDependenciesLoaded,
	canSubmitChanges,
	haveSettingsChanged,
	handleConfirm,
	handleClose,
	handleEdit,
	slug,
	name,
	forceActive,
} ) {
	if ( isEditing || isSaving ) {
		return (
			<Fragment>
				{ hasSettings && moduleConnected ? (
					<SpinnerButton
						disabled={
							isSaving ||
							! areSettingsEditDependenciesLoaded ||
							( ! canSubmitChanges && haveSettingsChanged )
						}
						onClick={ handleConfirm }
						isSaving={ isSaving }
					>
						{ ( () => {
							if ( isSaving ) {
								return __( 'Saving…', 'google-site-kit' );
							}
							if ( haveSettingsChanged ) {
								return __(
									'Confirm changes',
									'google-site-kit'
								);
							}
							return __( 'Save', 'google-site-kit' );
						} )() }
					</SpinnerButton>
				) : (
					<Button onClick={ handleClose }>
						{ __( 'Close', 'google-site-kit' ) }
					</Button>
				) }

				{ hasSettings && (
					<Button
						tertiary
						className="googlesitekit-settings-module__footer-cancel"
						onClick={ handleClose }
					>
						{ __( 'Cancel', 'google-site-kit' ) }
					</Button>
				) }
			</Fragment>
		);
	}

	if ( hasSettings || ! forceActive ) {
		return (
			<Link
				className="googlesitekit-settings-module__edit-button"
				to={ `/connected-services/${ slug }/edit` }
				onClick={ handleEdit }
				aria-label={ sprintf(
					/* translators: %s: module name */
					__( 'Edit %s settings', 'google-site-kit' ),
					name
				) }
				trailingIcon={
					<PencilIcon
						className="googlesitekit-settings-module__edit-button-icon"
						width={ 10 }
						height={ 10 }
					/>
				}
			>
				{ __( 'Edit', 'google-site-kit' ) }
			</Link>
		);
	}

	return null;
}
