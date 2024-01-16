/**
 * SiteVerification component.
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
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { Button, ProgressBar, TextField } from 'googlesitekit-components';
import { validateJSON, trackEvent } from '../../util';

class SiteVerification extends Component {
	constructor( props ) {
		super( props );

		const { isAuthenticated, shouldSetup } = this.props;

		this.state = {
			loading: isAuthenticated && shouldSetup,
			loadingMsg: __( 'Getting your verified sites…', 'google-site-kit' ),
			siteURL: ' ', // Space allows TextField label to look right.
			selectedURL: '',
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

		( async () => {
			try {
				const { verified, identifier } = await API.get(
					'modules',
					'site-verification',
					'verification',
					undefined,
					{ useCache: false }
				);

				// Our current siteURL has been verified. Proceed to next step.
				if ( verified ) {
					await trackEvent(
						'verification_setup',
						'verification_check_true'
					);

					const response = await this.insertSiteVerification(
						identifier
					);

					if ( true === response.verified ) {
						this.props.siteVerificationSetup( true );
						return true;
					}
				} else {
					await trackEvent(
						'verification_setup',
						'verification_check_false'
					);
				}

				this.setState( {
					loading: false,
					siteURL: identifier,
				} );
			} catch ( err ) {
				let message = err.message;

				if ( validateJSON( err.message ) ) {
					const errorJSON = JSON.parse( err.message );
					message = errorJSON.error.message || err.message;
				}

				setErrorMessage( message );

				this.setState( {
					loading: false,
					errorCode: err.code,
					errorMsg: message,
					siteURL: global._googlesitekitLegacyData.admin.siteURL, // Fallback to site URL from the settings.
				} );
			}
		} )();
	}

	async insertSiteVerification( siteURL ) {
		return await API.set( 'modules', 'site-verification', 'verification', {
			siteURL,
		} );
	}

	async onProceed() {
		const { setErrorMessage } = this.props;

		// Try to get siteURL from state, and if blank get from the settings.
		const siteURL = this.state.siteURL
			? this.state.siteURL
			: global._googlesitekitLegacyData.admin.siteURL;

		setErrorMessage( '' );

		this.setState( {
			loading: true,
			loadingMsg: __( 'Verifying…', 'google-site-kit' ),
			errorCode: false,
			errorMsg: '',
		} );

		try {
			const response = await this.insertSiteVerification( siteURL );

			if ( true === response.verified ) {
				trackEvent( 'verification_setup', 'verification_insert_tag' );

				// We have everything we need here. go to next step.
				this.props.siteVerificationSetup( true );
			}
		} catch ( err ) {
			let message = err.message;

			if ( validateJSON( err.message ) ) {
				const errorJSON = JSON.parse( err.message );
				message = errorJSON.error.message || err.message;
			}

			setErrorMessage( message );

			this.setState( {
				loading: false,
				errorCode: err.code,
				errorMsg: message,
			} );
		}
	}

	renderForm() {
		const { loading, loadingMsg, siteURL } = this.state;

		const loadingDiv = (
			<Fragment>
				{ loadingMsg && <p>{ loadingMsg }</p> }
				<ProgressBar />
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
						outlined
						value={ siteURL }
					/>
				</div>
				<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
					<Button onClick={ this.onProceed }>
						{ __( 'Continue', 'google-site-kit' ) }
					</Button>
				</div>
			</Fragment>
		);
	}

	static renderSetupDone() {
		return (
			<Fragment>
				<h2
					className="
					googlesitekit-heading-3
					googlesitekit-wizard-step__title
				"
				>
					{ __( 'Verify URL', 'google-site-kit' ) }
				</h2>

				<p className="googlesitekit-wizard-step__text">
					{ __(
						'Congratulations, your site has been verified!',
						'google-site-kit'
					) }
				</p>
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
				<h2
					className="
					googlesitekit-heading-3
					googlesitekit-wizard-step__title
				"
				>
					{ __( 'Verify URL', 'google-site-kit' ) }
				</h2>

				<p className="googlesitekit-wizard-step__text">
					{ __(
						'We will need to verify your URL for Site Kit.',
						'google-site-kit'
					) }
				</p>

				{ errorMsg && 0 < errorMsg.length && (
					<p className="googlesitekit-error-text">{ errorMsg }</p>
				) }

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
