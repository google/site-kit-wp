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
import Link from 'GoogleComponents/link';
import Dialog from 'GoogleComponents/dialog';
import Optin from 'GoogleComponents/optin';
import data, { TYPE_CORE } from 'GoogleComponents/data';
import {
	clearAppLocalStorage,
	moduleIcon,
	getSiteKitAdminURL,
} from 'GoogleUtil';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class SettingsAdmin extends Component {
	constructor() {
		super();

		const { userData: { email = '', picture = '', name = '' } } = googlesitekit.admin;

		this.state = {
			data: {
				email,
				img: picture,
				user: name,
			},
			dialogActive: false,
		};

		this.handleDialog = this.handleDialog.bind( this );
		this.handleUnlinkConfirm = this.handleUnlinkConfirm.bind( this );
		this.handleCloseModal = this.handleCloseModal.bind( this );
	}

	componentDidMount() {
		window.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		window.removeEventListener( 'keyup', this.handleCloseModal );
	}

	handleDialog() {
		this.setState( ( prevState ) => {
			return {
				dialogActive: ! prevState.dialogActive,
			};
		} );
	}

	async handleUnlinkConfirm() {
		await data.set( TYPE_CORE, 'site', 'reset' );
		clearAppLocalStorage();
		this.handleDialog();
		document.location = getSiteKitAdminURL( 'googlesitekit-splash' );
	}

	handleCloseModal( e ) {
		if ( 27 === e.keyCode ) {
			this.setState( {
				dialogActive: false,
			} );
		}
	}

	render() {
		const {
			dialogActive,
		} = this.state;
		const {
			clientID,
			clientSecret,
			apikey,
			projectId,
			projectUrl,
		} = googlesitekit.admin;

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
											{ moduleIcon( 'logo-google-cloud', false, '24', '26', 'googlesitekit-settings-module__title-icon' ) }
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
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-12
									">
										<div className="googlesitekit-settings-module__meta-items">
											<div className="googlesitekit-settings-module__meta-item">
												<p className="googlesitekit-settings-module__meta-item-type">
													{ __( 'Client ID', 'google-site-kit' ) }
												</p>
												<h5 className="
													googlesitekit-settings-module__meta-item-data
													googlesitekit-settings-module__meta-item-data--wrap
												">
													{ clientID }
												</h5>
											</div>
											<div className="googlesitekit-settings-module__meta-item">
												<p className="googlesitekit-settings-module__meta-item-type">
													{ __( 'Client Secret', 'google-site-kit' ) }
												</p>
												<h5 className="
													googlesitekit-settings-module__meta-item-data
													googlesitekit-settings-module__meta-item-data--wrap
												">
													{ clientSecret }
												</h5>
											</div>
										</div>
										{ apikey &&
											<div className="googlesitekit-settings-module__meta-items">
												<div
													className={ 'googlesitekit-settings-module__meta-item' + ( projectId && projectUrl ? '' : 'googlesitekit-settings-module__meta-item--nomargin' ) }
												>
													<p className="googlesitekit-settings-module__meta-item-type">
														{ __( 'API Key', 'google-site-kit' ) }
													</p>
													<h5 className="
														googlesitekit-settings-module__meta-item-data
														googlesitekit-settings-module__meta-item-data--wrap
													">
														{ apikey }
													</h5>
												</div>
											</div>
										}
										{ ( projectId && projectUrl ) &&
											<div className="googlesitekit-settings-module__meta-items">
												<div className="
													googlesitekit-settings-module__meta-item
													googlesitekit-settings-module__meta-item--nomargin
												">
													<p className="googlesitekit-settings-module__meta-item-type">
														{ __( 'Project ID', 'google-site-kit' ) }
													</p>
													<h5 className="
														googlesitekit-settings-module__meta-item-data
														googlesitekit-settings-module__meta-item-data--wrap
													">
														{ projectId + ' ' }
														<small>
															<Link
																href={ projectUrl }
																inherit
																external
															>
																{ __( 'Open in Google Cloud Platform', 'google-site-kit' ) }
															</Link>
														</small>
													</h5>
												</div>
											</div>
										}
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
											<Link
												onClick={ this.handleDialog }
												inherit
											>
												{ __( 'Reset Site Kit', 'google-site-kit' ) }
											</Link>
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
												<Optin
													id="opt-in"
													name="optin"
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Layout>
				</div>
				<Dialog
					dialogActive={ dialogActive }
					handleConfirm={ this.handleUnlinkConfirm }
					handleDialog={ this.handleDialog }
					title={ __( 'Reset Site Kit', 'google-site-kit' ) }
					subtitle={ __( 'Resetting this site will remove access to all services. After disconnecting, you will need to re-authorize your access to restore service.', 'google-site-kit' ) }
					confirmButton={ __( 'Reset', 'google-site-kit' ) }
					provides={ [] }
				/>
			</Fragment>
		);
	}
}

export default SettingsAdmin;
