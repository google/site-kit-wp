/**
 * ModuleSettingsHeader component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { moduleIcon } from '../../../util';
import { STORE_NAME } from '../datastore/constants';
const { useDispatch, useSelect } = Data;

function ModuleSettingsHeader( { slug } ) {
	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsViewModuleOpen( slug ) );
	const isConnected = useSelect( ( select ) => select( STORE_NAME ).isModuleConnected( slug ) );
	const { name } = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) ) || {};

	const { toggleSettingsViewModuleOpen } = useDispatch( STORE_NAME );
	const handleAccordion = useCallback( () => {
		toggleSettingsViewModuleOpen( slug );
	}, [ slug ] );

	let moduleStatus, moduleStatusForReader;

	if ( isConnected ) {
		/* translators: %s: module name. */
		moduleStatus = sprintf( __( '%s is connected', 'google-site-kit' ), name );
		moduleStatusForReader = __( 'Connected', 'google-site-kit' );
	} else {
		/* translators: %s: module name. */
		moduleStatus = sprintf( __( '%s is not connected', 'google-site-kit' ), name );
		moduleStatusForReader = __( 'Not Connected', 'google-site-kit' );
	}

	return (
		<button
			id={ `googlesitekit-settings-module__header--${ slug }` }
			className={ classnames( 'googlesitekit-settings-module__header', { 'googlesitekit-settings-module__header--open': isOpen } ) }
			type="button"
			role="tab"
			aria-selected={ isOpen }
			aria-expanded={ isOpen }
			aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
			onClick={ handleAccordion }
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone">
						<h3 className="googlesitekit-heading-4 googlesitekit-settings-module__title">
							{ moduleIcon( slug, false, '24', '26', 'googlesitekit-settings-module__title-icon' ) }
							{ name }
						</h3>
					</div>
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--align-middle mdc-layout-grid__cell--align-right-tablet">
						<p className="googlesitekit-settings-module__status">
							{ moduleStatus }
							<span className={ classnames( 'googlesitekit-settings-module__status-icon', {
								'googlesitekit-settings-module__status-icon--connected': isConnected,
								'googlesitekit-settings-module__status-icon--not-connected': ! isConnected,
							} ) }>
								<span className="screen-reader-text">
									{ moduleStatusForReader }
								</span>
							</span>
						</p>
					</div>
				</div>
			</div>
		</button>
	);
}

ModuleSettingsHeader.propTypes = {
	slug: PropTypes.string.isRequired,
};

export default ModuleSettingsHeader;
