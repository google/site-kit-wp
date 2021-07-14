/**
 * ModuleSetup component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../Header';
import Link from '../Link';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import HelpMenu from '../help/HelpMenu';
import HelpMenuLink from '../help/HelpMenuLink';
const { useSelect, useDispatch } = Data;

export default function ModuleSetup( { moduleSlug } ) {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const settingsPageURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' ) );
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) );

	const args = {
		notification: 'authentication_success',
	};

	if ( moduleSlug ) {
		args.slug = moduleSlug;
	}

	const adminURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', args ) );

	/**
	 * When module setup done, we redirect the user to Site Kit dashboard.
	 *
	 * @since 1.0.0
	 * @since 1.18.0 Added optional redirectURL parameter.
	 *
	 * @param {string} [redirectURL] URL to redirect to when complete. Defaults to Site Kit dashboard.
	 */
	const finishSetup = useCallback( ( redirectURL ) => {
		navigateTo( redirectURL || adminURL );
	}, [ adminURL, navigateTo ] );

	if ( ! module?.SetupComponent ) {
		return null;
	}

	const { SetupComponent } = module;

	return (
		<Fragment>
			<Header>
				<HelpMenu>
					{ moduleSlug === 'adsense' && (
						<HelpMenuLink href="https://support.google.com/adsense/">
							{ __( 'Get help with AdSense', 'google-site-kit' ) }
						</HelpMenuLink>
					) }
				</HelpMenu>
			</Header>
			<div className="googlesitekit-setup">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<section className="googlesitekit-setup__wrapper">
								<div className="mdc-layout-grid">
									<div className="mdc-layout-grid__inner">
										<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-12
										">
											<p className="
												googlesitekit-setup__intro-title
												googlesitekit-overline
											">
												{ __( 'Connect Service', 'google-site-kit' ) }
											</p>
											<SetupComponent
												module={ module }
												finishSetup={ finishSetup }
											/>
										</div>
									</div>
								</div>
								<div className="googlesitekit-setup__footer">
									<div className="mdc-layout-grid">
										<div className="mdc-layout-grid__inner">
											<div className="
													mdc-layout-grid__cell
													mdc-layout-grid__cell--span-2-phone
													mdc-layout-grid__cell--span-4-tablet
													mdc-layout-grid__cell--span-6-desktop
												">
												<Link
													id={ `setup-${ module.slug }-cancel` }
													href={ settingsPageURL }
												>{ __( 'Cancel', 'google-site-kit' ) }</Link>
											</div>
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
}

ModuleSetup.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
