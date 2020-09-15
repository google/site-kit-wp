/**
 * ModuleSettingsFooter component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import API from 'googlesitekit-api';
import { clearWebStorage } from '../../../util';
import Button from '../../../components/button';
import Link from '../../../components/link';
import Spinner from '../../../components/spinner';
import SvgIcon from '../../../util/svg-icon';
import { STORE_NAME } from '../datastore/constants';
import ModuleSettingsDialog from './ModuleSettingsDialog';
const { useDispatch, useSelect } = Data;

function ModuleSettingsFooter( { slug, allowEdit, provides, onSave, canSave, onDisconnected } ) {
	const [ dialogActive, setDialogActive ] = useState( false );

	const module = useSelect( ( select ) => select( STORE_NAME ).getModule() );
	const isEditing = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleEditing( slug ) );
	const isSavingModuleSettings = false; // TODO: update

	const toggleDialogState = useCallback( () => {
		setDialogActive( ! dialogActive );
	}, [ dialogActive ] );

	const { setSettingsViewIsEditing } = useDispatch( STORE_NAME );

	const handleSave = useCallback( async () => {
		try {
			await onSave();
			// Clears session and local storage on successful setting.
			clearWebStorage();
			// Only switch to the settings view on success.
			setSettingsViewIsEditing( false );
		} catch {}
	}, [ onSave, setSettingsViewIsEditing ] );

	const handleEdit = useCallback( () => {
		setSettingsViewIsEditing( true );
	}, [ setSettingsViewIsEditing ] );

	const handleCancel = useCallback( () => {
		setSettingsViewIsEditing( false );
	}, [ setSettingsViewIsEditing ] );

	const { deactivateModule } = useDispatch( STORE_NAME );
	const handleDisconnect = useCallback( async () => {
		try {
			await deactivateModule( slug );
			await API.invalidateCache( 'modules', slug );
			if ( onDisconnected ) {
				onDisconnected();
			}
		} catch {} // User should see error in interface.
	}, [ onDisconnected ] );

	const { forceActive, homepage, name, connected } = module;
	const canDisconnect = ! forceActive;

	const buttons = [];
	if ( isEditing || isSavingModuleSettings ) {
		if ( onSave && connected ) {
			buttons.push(
				<Button key="save-btn" onClick={ () => handleSave() } disabled={ isSavingModuleSettings || ! canSave }>
					{ isSavingModuleSettings ? __( 'Saving…', 'google-site-kit' ) : __( 'Confirm Changes', 'google-site-kit' ) }
				</Button>,
				<Spinner key="saving-spinner" isSaving={ isSavingModuleSettings } />,
				<Link key="cancel-btn" className="googlesitekit-settings-module__footer-cancel" inherit onClick={ () => handleCancel() }>
					{ __( 'Cancel', 'google-site-kit' ) }
				</Link>
			);
		} else {
			buttons.push(
				<Button key="close-btn" onClick={ () => handleCancel() }>
					{ __( 'Close', 'google-site-kit' ) }
				</Button>
			);
		}
	} else if ( allowEdit || canDisconnect ) {
		buttons.push(
			<Link key="edit-btn" className="googlesitekit-settings-module__edit-button" inherit onClick={ () => handleEdit() }>
				{ __( 'Edit', 'google-site-kit' ) }
				<SvgIcon
					className="googlesitekit-settings-module__edit-button-icon"
					id="pencil"
					width="10"
					height="10"
				/>
			</Link>
		);
	}

	return (
		<footer className="googlesitekit-settings-module__footer">
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div
						className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-6-desktop',
							'mdc-layout-grid__cell--span-8-tablet',
							'mdc-layout-grid__cell--span-4-phone'
						) }
					>
						{ buttons }
					</div>

					<div
						className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-6-desktop',
							'mdc-layout-grid__cell--span-8-tablet',
							'mdc-layout-grid__cell--span-4-phone',
							'mdc-layout-grid__cell--align-middle',
							'mdc-layout-grid__cell--align-right-desktop'
						) }
					>
						{ isEditing && canDisconnect && (
							<Link
								className="googlesitekit-settings-module__remove-button"
								onClick={ toggleDialogState }
								danger
								inherit
							>
								{
									/* translators: %s: module name */
									sprintf( __( 'Disconnect %s from Site Kit', 'google-site-kit' ), name )
								}

								<SvgIcon
									className="googlesitekit-settings-module__remove-button-icon"
									id="trash"
									width="13"
									height="13"
								/>
							</Link>
						) }

						{ ! isEditing && (
							<Link
								className="googlesitekit-settings-module__cta-button"
								href={ homepage }
								external
								inherit
							>
								{
									/* translators: %s: module name */
									sprintf( __( 'See full details in %s', 'google-site-kit' ), name )
								}
							</Link>
						) }
					</div>

					{ dialogActive && (
						<ModuleSettingsDialog
							slug={ slug }
							provides={ provides || [] }
							toggleDialogState={ toggleDialogState }
							onRemove={ handleDisconnect }
						/>
					) }
				</div>
			</div>
		</footer>
	);
}

ModuleSettingsFooter.propTypes = {
	slug: PropTypes.string.isRequired,
	allowEdit: PropTypes.bool,
	onSave: PropTypes.func,
	onDisconnected: PropTypes.func,
	canSave: PropTypes.bool,
	provides: PropTypes.arrayOf( PropTypes.string ),
};

ModuleSettingsFooter.defaultProps = {
	allowEdit: false,
	provides: [],
	canSave: false,
};

export default ModuleSettingsFooter;
