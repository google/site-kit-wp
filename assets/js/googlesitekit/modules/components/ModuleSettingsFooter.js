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
import { clearWebStorage, activateOrDeactivateModule, getReAuthURL } from '../../../util';
import { refreshAuthentication } from '../../../util/refresh-authentication';
import restApiClient, { TYPE_MODULES } from '../../../components/data';
import Button from '../../../components/button';
import Link from '../../../components/link';
import Spinner from '../../../components/spinner';
import SvgIcon from '../../../util/svg-icon';
import { STORE_NAME, SETTINGS_DISPLAY_MODES } from '../datastore/constants';
import ModuleSettingsDialog from './ModuleSettingsDialog';
const { useDispatch, useSelect } = Data;

function ModuleSettingsFooter( { slug, allowEdit, provides, onSave, canSave } ) {
	const [ dialogActive, setDialogActive ] = useState( false );

	const {
		module,
		isEditing,
		isSavingModuleSettings,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			module: store.getModule( slug ),
			isEditing: store.isSettingsViewModuleEditing( slug ),
			isSavingModuleSettings: false, // TODO: update
		};
	} );

	const toggleDialogState = useCallback( () => {
		setDialogActive( ! dialogActive );
	}, [ dialogActive ] );

	const { setSettingsDisplayMode } = useDispatch( STORE_NAME );

	const handleSave = useCallback( () => {
		setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.SAVING );

		const modulePromise = onSave();
		if ( ! modulePromise ) {
			// Clears session and local storage on successful setting.
			clearWebStorage();
			return;
		}

		modulePromise.then( () => {
			// Clears session and local storage on every successful setting.
			clearWebStorage();
			// TODO Set error to false
			// Change status from 'saving' to 'view'.
			setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.VIEW );
		} ).catch( () => {
			// TODO: Set error in store.
			// Change status from 'saving' to 'view'.
			setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.VIEW );
		} );
	}, [] );

	const handleEdit = useCallback( () => {
		setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.EDIT );
	}, [] );

	const handleCancel = useCallback( () => {
		setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.VIEW );
	}, [] );

	const handleDisconnect = useCallback( async () => {
		try {
			setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.SAVING );

			await activateOrDeactivateModule( restApiClient, slug, false );
			await refreshAuthentication();
			restApiClient.invalidateCacheGroup( TYPE_MODULES, slug );
			global.location = getReAuthURL( slug, false );
		} catch ( err ) {
			// @TODO: properly handle error state.
			setSettingsDisplayMode( slug, SETTINGS_DISPLAY_MODES.VIEW );
		}
	}, [] );

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
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--span-4-phone">
						{ buttons }
					</div>
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--align-middle mdc-layout-grid__cell--align-right-desktop">
						{ isEditing && canDisconnect && (
							<Link className="googlesitekit-settings-module__remove-button" inherit danger onClick={ toggleDialogState }>
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
							<Link href={ homepage } className="googlesitekit-settings-module__cta-button" inherit external>
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
	provides: PropTypes.arrayOf( PropTypes.string ),
	onSave: PropTypes.func,
	canSave: PropTypes.bool,
};

ModuleSettingsFooter.defaultProps = {
	allowEdit: false,
	provides: [],
	canSave: false,
};

export default ModuleSettingsFooter;
