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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	moduleIcon,
} from '../../../util';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;

const ModuleSettingsHeader = ( { slug } ) => {
	const module = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) );
	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsOpen( slug ) );
	const { connected, name } = module.settings;

	const connectedClassName = connected
		? 'googlesitekit-settings-module__status-icon--connected'
		: 'googlesitekit-settings-module__status-icon--not-connected';

	return (
		<button
			className={ classnames(
				'googlesitekit-settings-module__header',
				{ 'googlesitekit-settings-module__header--open': isOpen }
			) }
			id={ `googlesitekit-settings-module__header--${ slug }` }
			type="button"
			role="tab"
			aria-selected={ !! isOpen }
			aria-expanded={ !! isOpen }
			aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
			onClick={ handleAccordion.bind( null, slug ) }
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="
                mdc-layout-grid__cell
                mdc-layout-grid__cell--span-6-desktop
                mdc-layout-grid__cell--span-4-tablet
                mdc-layout-grid__cell--span-4-phone
            ">
						<h3 className="
                    googlesitekit-heading-4
                    googlesitekit-settings-module__title
                ">
							{ moduleIcon( slug, false, '24', '26', 'googlesitekit-settings-module__title-icon' ) }
							{ name }
						</h3>
					</div>
					<div className="
                mdc-layout-grid__cell
                mdc-layout-grid__cell--span-6-desktop
                mdc-layout-grid__cell--span-4-tablet
                mdc-layout-grid__cell--span-4-phone
                mdc-layout-grid__cell--align-middle
                mdc-layout-grid__cell--align-right-tablet
            ">
						<p className="googlesitekit-settings-module__status">
							{
								connected
									? sprintf(
										/* translators: %s: module name. */
										__( '%s is connected', 'google-site-kit' ),
										name
									)
									: sprintf(
										/* translators: %s: module name. */
										__( '%s is not connected', 'google-site-kit' ),
										name
									)
							}
							<span className={ classnames(
								'googlesitekit-settings-module__status-icon',
								connectedClassName
							) }>
								<span className="screen-reader-text">
									{ connected
										? __( 'Connected', 'google-site-kit' )
										: __( 'Not Connected', 'google-site-kit' )
									}
								</span>
							</span>
						</p>
					</div>
				</div>
			</div>
		</button>
	);
};

ModuleSettingsHeader.propTypes = {
	slug: PropTypes.string.isRequired,
};

export default ModuleSettingsHeader;
