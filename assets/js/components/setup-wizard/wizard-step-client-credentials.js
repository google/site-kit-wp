/**
 * WizardStepClientCredentials component.
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

import PropTypes from 'prop-types';
import Link from 'GoogleComponents/link';
import { TextField, Input } from 'SiteKitCore/material-components';
import Button from 'GoogleComponents/button';
import data from '../data';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';
import HelpLink from 'GoogleComponents/help-link';

/**
 * WordPress dependencies.
 */
const { __ } = wp.i18n;
const { Component } = wp.element;
const { addQueryArgs } = wp.url;

class WizardStepClientCredentials extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			clientConfiguration: '',
			clientID: '',
			clientSecret: '',
			projectID: '',
			isSaving: false,
			errorMsg: '',
		};

		this.handleClientConfigurationEntry = this.handleClientConfigurationEntry.bind( this );
		this.onProceed = this.onProceed.bind( this );
	}

	componentDidMount() {
		const {
			isSiteKitConnected,
			siteConnectedSetup,
		} = this.props;

		this._isMounted = true;

		// Double check isSiteKitConnected.
		if ( ! isSiteKitConnected ) {
			( async() => {
				let response;
				try {
					response = await data.get( 'core', 'site', 'credentials' );
				} catch ( e ) { // eslint-disable-line no-empty
				}
				if ( response ) {
					googlesitekit.setup.isSiteKitConnected = true;
					siteConnectedSetup( true );
				}
			} )();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	async onProceed() {
		const {
			clientID,
			clientSecret,
			projectID,
		} = this.state;

		if ( 0 === clientID.length || 0 === clientSecret.length ) {
			return;
		}

		const credentials = {
			clientID,
			clientSecret,
		};

		sendAnalyticsTrackingEvent( 'plugin_setup', 'client_id_secret_entered' );

		try {
			this.setState( { isSaving: true } );

			await data.set( 'core', 'site', 'credentials', credentials );

			if ( projectID && projectID.length ) {
				await data.set( 'core', 'site', 'gcpproject', { projectID } );
			}

			if ( this._isMounted ) {
				this.setState( {
					isSaving: false,
				} );
			}

			// Go to next step.
			this.props.siteConnectedSetup( true );

		} catch ( err ) {
			if ( this._isMounted ) {
				this.setState( {
					errorMsg: err.message
				} );
			}

			this.props.setErrorMessage( err.message );
		}
	}

	handleClientConfigurationEntry( e ) {
		const value = e.target.value.trim();
		this.setState( {
			clientConfiguration: value,
		} );

		if ( '' === value ) {
			this.setState( {
				errorMsg: '',
				clientID: '',
				clientSecret: '',
				projectID: '',
			} );
			return;
		}

		let data = false;
		try {
			data = JSON.parse( value );
		} catch ( e ) {
			this.setState( {
				errorMsg: __( 'Unable to parse client configuration values.', 'google-site-kit' ),
				clientID: '',
				clientSecret: '',
				projectID: '',
			} );
		}

		if ( data && data.web ) {
			const {
				web: {
					client_id: clientID,
					client_secret: clientSecret,
					project_id: projectID,
				}
			} = data;

			this.setState( {
				errorMsg: '',
				clientID,
				clientSecret,
				projectID,
			} );
		}
	}

	render() {
		let { externalCredentialsURL } = googlesitekit.admin;

		// If an Ad blocker is enabled, pass a quuery var in the external credentials URL.
		const { canAdsRun } = googlesitekit;
		if ( ! canAdsRun ) {
			externalCredentialsURL = addQueryArgs( externalCredentialsURL,
				{
					warn_adblocker: 'true', /*eslint camelcase: 0*/
				} );
		}
		const {
			clientConfiguration,
			clientID,
			clientSecret,
			errorMsg,
		} = this.state;

		const externalCredentialsURLLabel = 'developers.google.com/web/sitekit';

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--one">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<h2 className="
								googlesitekit-heading-3
								googlesitekit-wizard-step__title
							">
								{ __( 'Welcome to Site Kit beta for developers.', 'google-site-kit' ) }
							</h2>
							<p>
								{ __( 'To complete the setup, it will help if you\'re familiar with Google Cloud Platform and OAuth.', 'google-site-kit' ) }
							</p>
							<p>
								{ __( 'If that sounds like you, get started by creating a client configuration on ', 'google-site-kit' ) }
								<Link href={ externalCredentialsURL } external inherit>
									{ externalCredentialsURLLabel }
								</Link>
							</p>
							<p>
								{ __( 'Once you paste it below, it will be valid for all other plugin users.', 'google-site-kit' ) }
							</p>
							{
								errorMsg && errorMsg.length &&
								<p className="googlesitekit-error-text">
									{ errorMsg }
								</p>
							}

							<div className="googlesitekit-wizard-step__inputs">
								<TextField
									className="mdc-text-field"
									label={ __( 'Client configuration', 'google-site-kit' ) }
									name="clientConfiguration"
									required
									onChange={ this.handleClientConfigurationEntry }
									outlined
									textarea
								>
									<Input
										id="client-configuration"
										value={ clientConfiguration || '' }
										autoComplete="off"
										rows="8"
									/>
								</TextField>
							</div>
							<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
								<Button id="wizard-step-one-proceed" onClick={ this.onProceed } disabled={ ! clientID || ! clientID.length || ! clientSecret || ! clientSecret.length }>{ __( 'Proceed', 'google-site-kit' ) }</Button>
								<HelpLink />
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
}

WizardStepClientCredentials.propTypes = {
	siteConnectedSetup: PropTypes.func.isRequired
};

export default WizardStepClientCredentials;
