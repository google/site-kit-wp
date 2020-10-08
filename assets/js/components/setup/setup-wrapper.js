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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../header';
import Link from '../link';
import HelpLink from '../help-link';
import { getSiteKitAdminURL } from '../../util';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function SetupWrapper() {
	const settingsPageURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' ) );
	const { moduleToSetup } = global._googlesitekitLegacyData.setup;
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleToSetup ) );

	/**
	 * When module setup done, we redirect the user to Site Kit dashboard.
	 */
	const finishSetup = useCallback( () => {
		const args = {
			notification: 'authentication_success',
		};

		if ( global._googlesitekitLegacyData.setup && global._googlesitekitLegacyData.setup.moduleToSetup ) {
			args.slug = global._googlesitekitLegacyData.setup.moduleToSetup;
		}

		const redirectURL = getSiteKitAdminURL(
			'googlesitekit-dashboard',
			args,
		);

		delay( function() {
			global.location.replace( redirectURL );
		}, 500, 'later' );
	}, [] );

	if ( ! module ) {
		return null;
	}

	const { setupComponent: SetupComponent } = module;

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
