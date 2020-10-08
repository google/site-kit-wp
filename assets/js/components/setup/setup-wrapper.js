/**
 * SetupWrapper component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../header';
import Link from '../link';
import HelpLink from '../help-link';
import { getSiteKitAdminURL } from '../../util';

class BaseComponent extends Component {
	render() {
		const { children } = this.props;
		return (
			<Fragment>
				{ children }
			</Fragment>
		);
	}
}

class SetupWrapper extends Component {
	constructor( props ) {
		super( props );

		const { moduleToSetup } = global._googlesitekitLegacyData.setup;
		this.state = {
			currentModule: moduleToSetup,
		};
	}

	static loadSetupModule( slug ) {
		// Disabled because this rule doesn't acknowledge our use of the variable
		// as a component in JSX.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const FilteredModuleSetup = withFilters( `googlesitekit.ModuleSetup-${ slug }` )( BaseComponent );

		return (
			<FilteredModuleSetup
				finishSetup={ SetupWrapper.finishSetup }
				onSettingsPage={ false }
				isEditing={ true }
			/>
		);
	}

	/**
	 * When module setup done, we redirect the user to Site Kit dashboard.
	 *
	 * @since 1.0.0
	 * @since n.e.x.t Added optional redirectURL parameter.
	 *
	 * @param {string} [redirectURL] URL to redirect to when complete. Defaults to Site Kit dashboard.
	 */
	static finishSetup( redirectURL ) {
		if ( ! redirectURL ) {
			const args = {
				notification: 'authentication_success',
			};

			if ( global._googlesitekitLegacyData?.setup?.moduleToSetup ) {
				args.slug = global._googlesitekitLegacyData.setup.moduleToSetup;
			}

			redirectURL = getSiteKitAdminURL( 'googlesitekit-dashboard', args );
		}

		delay( function() {
			global.location.replace( redirectURL );
		}, 500, 'later' );
	}

	render() {
		const { currentModule } = this.state;
		const setupModule = SetupWrapper.loadSetupModule( currentModule );
		const settingsPageURL = getSiteKitAdminURL(
			'googlesitekit-settings',
			{}
		);

		return (
			<Fragment>
				<Header />
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
												{ setupModule }
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
														id={ `setup-${ currentModule }-cancel` }
														href={ settingsPageURL }
													>{ __( 'Cancel', 'google-site-kit' ) }</Link>
												</div>
												<div className="
														mdc-layout-grid__cell
														mdc-layout-grid__cell--span-2-phone
														mdc-layout-grid__cell--span-4-tablet
														mdc-layout-grid__cell--span-6-desktop
														mdc-layout-grid__cell--align-right
												">
													<HelpLink />
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
}

export default SetupWrapper;
