/**
 * SiteVerification component.
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

import data from 'GoogleComponents/data';
import Button from 'GoogleComponents/button';
import ProgressBar from 'GoogleComponents/progress-bar';
import { TextField, Input } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';
import {
	validateJSON,
	sendAnalyticsTrackingEvent,
} from 'GoogleUtil';
import HelpLink from 'GoogleComponents/help-link';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class SiteVerification extends Component {

	constructor( props ) {
		super( props );

		const { isAuthenticated, shouldSetup } = this.props;

		this.state = {
			loading: isAuthenticated && shouldSetup,
			loadingMsg: __( 'Getting your verified sites...', 'google-site-kit' ),
			siteURL: ' ', // Space allows TextField label to look right.
			selectedUrl: '',
			errorCode: false,
			errorMsg: '',
		};

		this.onProceed = this.onProceed.bind( this );
	}

	componentDidMount() {
		const { isAuthenticated, shouldSetup } = this.props;

		if ( ! isAuthenticated || ! shouldSetup ) {
			return;
		}

		this.requestSitePropertyList();
	}

	requestSitePropertyList() {
		const { setErrorMessage } = this.props;

		( async() => {
			try {
				let responseData = await data.get( 'modules', 'search-console',
					'siteverification-list' );

				const { verified, identifier } = responseData;

				// Our current siteURL has been verified. Proceed to next step.
				if ( verified ) {
					sendAnalyticsTrackingEvent( 'verification_setup', 'verification_check_true' );

					const response = await this.insertSiteVerification( identifier );
					if ( true === response.updated ) {
						this.props.siteVerificationSetup( true );
						return true;
					}
				} else {
					sendAnalyticsTrackingEvent( 'verification_setup', 'verification_check_false' );
				}

				this.setState( {
					loading: false,
					siteURL: responseData.identifier,
				} );

			} catch ( err ) {

				let message = err.message;

				if ( validateJSON( err.message ) ) {
					const errorJson = JSON.parse( err.message );
					message = errorJson.error.message || err.message;
				}

				setErrorMessage( message );

				this.setState( {
					loading: false,
					errorCode: err.code,
					errorMsg: message,
					siteURL: googlesitekit.admin.siteURL, // Fallback to site URL from the settings.
				} );
			}
		} )();
	}

	async insertSiteVerification( siteURL ) {
		return await data.set( 'modules', 'search-console', 'siteverification', { siteURL } );
	}

	async onProceed() {
		const { setErrorMessage } = this.props;

		// Try to get siteURL from state, and if blank get from the settings.
		const siteURL = this.state.siteURL ? this.state.siteURL : googlesitekit.admin.siteURL;

		setErrorMessage( '' );

		this.setState( {
			loading: true,
			loadingMsg: __( 'Verifying...', 'google-site-kit' ),
			errorCode: false,
			errorMsg: '',
		} );

		try {

			const response = await this.insertSiteVerification( siteURL );

			if ( true === response.updated ) {
				sendAnalyticsTrackingEvent( 'verification_setup', 'verification_insert_tag' );

				// We have everything we need here. go to next step.
				this.props.siteVerificationSetup( true );
			}
		} catch ( err ) {
			let message = err.message;

			if ( validateJSON( err.message ) ) {
				const errorJson = JSON.parse( err.message );
				message = errorJson.error.message || err.message;
			}

			setErrorMessage( message );

			this.setState( {
				loading: false,
				errorCode: err.code,
				errorMsg: message
			} );
		}

	}

	renderForm() {
		const { loading, loadingMsg, siteURL } = this.state;

		const loadingDiv = (
			<Fragment>
				{ loadingMsg &&
					<p>{ loadingMsg }</p>
				}
				<ProgressBar/>
			</Fragment>
		);

		// If the site is verified then we continue to next step. show loading div.
		if ( loading ) {
			return loadingDiv;
		}

		return (
			<Fragment>
				<div className="googlesitekit-wizard-step__inputs">
					<TextField
						label={ __( 'Website Address', 'google-site-kit' ) }
						name="siteProperty"
						floatingLabelClassName="mdc-floating-label--float-above"
						outlined
						disabled
					>
						<Input
							value={ siteURL }
						/>
					</TextField>
				</div>
				<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
					<Button onClick={ this.onProceed }>{ __( 'Continue', 'google-site-kit' ) }</Button>
					<HelpLink/>
				</div>
			</Fragment>
		);
	}

	static renderSetupDone() {
		return (
			<Fragment>
				<h2 className="
					googlesitekit-heading-3
					googlesitekit-wizard-step__title
				">
					{ __( 'Verify URL', 'google-site-kit' ) }
				</h2>

				<p className="googlesitekit-wizard-step__text">{ __( 'Congratulations, your site has been verified!', 'google-site-kit' ) }</p>
			</Fragment>
		);
	}

	render() {
		const { isAuthenticated, shouldSetup } = this.props;
		const { errorMsg } = this.state;

		if ( ! shouldSetup ) {
			return SiteVerification.renderSetupDone();
		}

		return (
			<Fragment>
				<h2 className="
					googlesitekit-heading-3
					googlesitekit-wizard-step__title
				">
					{ __( 'Verify URL', 'google-site-kit' ) }
				</h2>

				<p className="googlesitekit-wizard-step__text">{ __( 'We will need to verify your URL for Site Kit.', 'google-site-kit' ) }</p>

				{
					errorMsg && 0 < errorMsg.length &&
					<p className="googlesitekit-error-text">
						{ errorMsg }
					</p>
				}

				{ isAuthenticated && this.renderForm() }

			</Fragment>
		);
	}
}

SiteVerification.propTypes = {
	isAuthenticated: PropTypes.bool.isRequired,
	shouldSetup: PropTypes.bool.isRequired,
	siteVerificationSetup: PropTypes.func.isRequired,
	completeSetup: PropTypes.func,
	setErrorMessage: PropTypes.func.isRequired,
};

export default SiteVerification;
