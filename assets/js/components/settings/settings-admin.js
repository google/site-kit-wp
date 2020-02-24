/**
 * SettingsOverview component.
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
import Layout from 'GoogleComponents/layout/layout';
import OptIn from 'GoogleComponents/optin';

/**
 * Internal dependencies
 */
import ResetButton from '../reset-button';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class SettingsAdmin extends Component {
	constructor() {
		super();

		const { userData: { email = '', picture = '', name = '' } } = global.googlesitekit.admin;

		this.state = {
			data: {
				email,
				img: picture,
				user: name,
			},
		};
	}

	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<Layout>
						<div className="
							googlesitekit-settings-module
							googlesitekit-settings-module--active
						">
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
											{ __( 'Plugin Status', 'google-site-kit' ) }
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
									</div>
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-12
									">
										<div className="googlesitekit-settings-module__meta-items">
											<p className="googlesitekit-settings-module__status">
												{ __( 'Site Kit is connected', 'google-site-kit' ) }
												<span className="
													googlesitekit-settings-module__status-icon
													googlesitekit-settings-module__status-icon--connected
												">
													<span className="screen-reader-text">
														{ __( 'Connected', 'google-site-kit' ) }
													</span>
												</span>
											</p>
										</div>
									</div>
								</div>
							</div>
							<footer className="googlesitekit-settings-module__footer">
								<div className="mdc-layout-grid">
									<div className="mdc-layout-grid__inner">
										<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-12
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
										">
											<ResetButton />
										</div>
									</div>
								</div>
							</footer>
						</div>
					</Layout>
				</div>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<Layout
						header
						title={ __( 'Tracking', 'google-site-kit' ) }
						className="googlesitekit-settings-meta"
						fill
					>
						<div className="
							googlesitekit-settings-module
							googlesitekit-settings-module--active
						">
							<div className="mdc-layout-grid">
								<div className="mdc-layout-grid__inner">
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-12
									">
										<div className="googlesitekit-settings-module__meta-items">
											<div className="
												googlesitekit-settings-module__meta-item
												googlesitekit-settings-module__meta-item--nomargin
											">
												<OptIn
													optinAction="analytics_optin_settings_page"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default SettingsAdmin;
