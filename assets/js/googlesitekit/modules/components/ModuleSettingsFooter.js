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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SvgIcon from '../../../util/svg-icon';
import {
	moduleIcon,
} from '../../../util';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;

const ModuleSettingsFooter = ( { allowEdit, provides, slug } ) => {
	const module = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) );
	const isEditing = useSelect( ( select ) => select( STORE_NAME ).isEditingSettings( slug ) );
	const { homepage, name } = module;

	const handleEdit = ( e ) => {

	};

	// Set button text based on state.
	let buttonText = __( 'Close', 'google-site-kit' );
	if ( allowEdit && setupComplete ) {
		if ( isSavingModule ) {
			buttonText = __( 'Saving…', 'google-site-kit' );
		} else {
			buttonText = __( 'Confirm Changes', 'google-site-kit' );
		}
	}

	return (
		<footer className="googlesitekit-settings-module__footer">
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-6-desktop
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
										">
						{ isEditing || isSavingModule ? (
							<Fragment>
								<Button
									onClick={ () => handleEdit( slug, allowEdit && setupComplete ? 'confirm' : 'cancel' ) }
									disabled={ isSavingModule }
									id={ allowEdit && setupComplete ? `confirm-changes-${ slug }` : `close-${ slug }` }
								>
									{ buttonText }
								</Button>
								<Spinner isSaving={ isSavingModule } />
								{ allowEdit &&
								<Link
									className="googlesitekit-settings-module__footer-cancel"
									onClick={ () => handleEdit( slug, 'cancel' ) }
									inherit
								>
									{ __( 'Cancel', 'google-site-kit' ) }
								</Link>
								}
							</Fragment>
						) : ( ( allowEdit || ! autoActivate ) &&
						<Link
							className="googlesitekit-settings-module__edit-button"
							onClick={ () => {
								handleEdit( slug, 'edit' );
							} }
							inherit
						>
							{ __( 'Edit', 'google-site-kit' ) }
							<SvgIcon
								className="googlesitekit-settings-module__edit-button-icon"
								id="pencil"
								width="10"
								height="10"
							/>
						</Link>
						) }
					</div>
					<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-6-desktop
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
											mdc-layout-grid__cell--align-middle
											mdc-layout-grid__cell--align-right-desktop
										">
						{ isEditing && ! autoActivate && (
							<Link
								className="googlesitekit-settings-module__remove-button"
								onClick={ this.handleDialog }
								inherit
								danger
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
								href={ homepage }
								className="googlesitekit-settings-module__cta-button"
								inherit
								external
							>
								{
									/* translators: %s: module name */
									sprintf( __( 'See full details in %s', 'google-site-kit' ), name )
								}
							</Link>
						) }
					</div>
				</div>
			</div>
		</footer>
	);
};

ModuleSettingsFooter.propTypes = {
	allowEdit: PropTypes.bool,
	slug: PropTypes.string.isRequired,

};

ModuleSettingsFooter.defaultProps = {
	allowEdit: false,
};

export default ModuleSettingsFooter;
