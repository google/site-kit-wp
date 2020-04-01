/**
 * Setup component.
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
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Header from 'GoogleComponents/header';
import Button from 'GoogleComponents/button';
import Layout from 'GoogleComponents/layout/layout';
import data, { TYPE_CORE } from 'GoogleComponents/data';
import { trackEvent, clearWebStorage } from 'GoogleUtil';
import { getSiteKitAdminURL } from '../util';
import STEPS from 'GoogleComponents/setup-wizard/wizard-steps';
import WizardProgressStep from 'GoogleComponents/setup-wizard/wizard-progress-step';

class Setup extends Component {
	constructor( props ) {
		super( props );

		const { connectURL } = global.googlesitekit.admin;

		const {
			isAuthenticated,
			hasSearchConsoleProperty,
			isSiteKitConnected,
			isVerified,
			needReauthenticate,
		} = global.googlesitekit.setup; /*eslint camelcase: 0*/

		const { canSetup } = global.googlesitekit.permissions;

		this.state = {
			canSetup,
			isAuthenticated,
			isVerified,
			needReauthenticate,
			hasSearchConsoleProperty,
			hasSearchConsolePropertyFromTheStart: hasSearchConsoleProperty,
			connectURL,
			errorMsg: '',
			isSiteKitConnected,
			completeSetup: false,
		};

		this.siteConnectedSetup = this.siteConnectedSetup.bind( this );
		this.siteVerificationSetup = this.siteVerificationSetup.bind( this );
		this.searchConsoleSetup = this.searchConsoleSetup.bind( this );
		this.resetAndRestart = this.resetAndRestart.bind( this );
		this.completeSetup = this.completeSetup.bind( this );
		this.setErrorMessage = this.setErrorMessage.bind( this );
	}

	async resetAndRestart() {
		await data.set( TYPE_CORE, 'site', 'reset' );
		clearWebStorage();

		this.setState( {
			isSiteKitConnected: false,
			isAuthenticated: false,
			isVerified: false,
			hasSearchConsoleProperty: false,
			completeSetup: false,
			errorMsg: '',
		} );
	}

	completeSetup() {
		this.setState( {
			completeSetup: true,
		} );
	}

	siteConnectedSetup( status ) {
		this.setState( {
			isSiteKitConnected: status,
		} );
	}

	siteVerificationSetup( status ) {
		this.setState( {
			isVerified: status,
		} );
	}

	searchConsoleSetup( status ) {
		this.setState( {
			hasSearchConsoleProperty: status,
		} );
	}

	isSetupFinished() {
		const {
			isSiteKitConnected,
			isAuthenticated,
			isVerified,
			hasSearchConsoleProperty,
			completeSetup,
		} = this.state;

		return isSiteKitConnected && isAuthenticated && isVerified && hasSearchConsoleProperty && completeSetup;
	}

	setErrorMessage( errorMsg ) {
		this.setState( {
			errorMsg,
		} );
	}

	getApplicableSteps() {
		const applicableSteps = STEPS;
		const slugs = Object.keys( applicableSteps );

		let i;
		for ( i = 0; i < slugs.length; i++ ) {
			if ( ! applicableSteps[ slugs[ i ] ].isApplicable( this.state ) ) {
				delete applicableSteps[ slugs[ i ] ];
			}
		}

		return applicableSteps;
	}

	currentStep( applicableSteps ) {
		const slugs = Object.keys( applicableSteps );

		// Iterate through all steps (except the last one) and return the first one that is not completed.
		let i;
		for ( i = 0; i < slugs.length - 1; i++ ) {
			if ( ! applicableSteps[ slugs[ i ] ].isCompleted( this.state ) ) {
				return slugs[ i ];
			}
		}

		// Return the last step only if all other steps are completed.
		return slugs[ i ];
	}

	stepStatus( applicableSteps, step ) {
		if ( applicableSteps[ step ].isCompleted( this.state ) ) {
			return 'completed';
		}

		const currentStep = this.currentStep( applicableSteps );

		if ( step === currentStep ) {
			return 'inprogress';
		}

		return '';
	}

	render() {
		const {
			canSetup,
			isAuthenticated,
			isVerified,
			needReauthenticate,
			hasSearchConsoleProperty,
			connectURL,
			isSiteKitConnected,
		} = this.state;

		if ( this.isSetupFinished() ) {
			const redirectURL = getSiteKitAdminURL(
				'googlesitekit-dashboard',
				{
					notification: 'authentication_success',
				},
			);

			delay( function() {
				global.location.replace( redirectURL );
			}, 500, 'later' );
		}

		const progressSteps = this.getApplicableSteps();
		const currentStep = this.currentStep( progressSteps );

		const WizardStepComponent = progressSteps[ currentStep ].Component;
		const wizardStepComponent = <WizardStepComponent
			siteConnectedSetup={ this.siteConnectedSetup }
			connectURL={ connectURL }
			siteVerificationSetup={ this.siteVerificationSetup }
			searchConsoleSetup={ this.searchConsoleSetup }
			completeSetup={ this.completeSetup }
			isSiteKitConnected={ isSiteKitConnected }
			isAuthenticated={ isAuthenticated }
			isVerified={ isVerified }
			needReauthenticate={ needReauthenticate }
			hasSearchConsoleProperty={ hasSearchConsoleProperty }
			setErrorMessage={ this.setErrorMessage }
			resetAndRestart={ progressSteps.clientCredentials ? this.resetAndRestart : undefined }
		/>;

		const showVerificationSteps = canSetup;
		const showAuthenticateButton = ! showVerificationSteps && ! isAuthenticated;

		return (
			<Fragment>
				<Header />
				<div className="googlesitekit-wizard">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<Layout>
									<section className="googlesitekit-wizard-progress">
										<div className="mdc-layout-grid">
											<div className="mdc-layout-grid__inner">
												{ showVerificationSteps &&
													<div className="
														mdc-layout-grid__cell
														mdc-layout-grid__cell--span-12
													">
														<div className="googlesitekit-wizard-progress__steps">
															{ Object.keys( progressSteps ).map( ( step, stepIndex ) => {
																return (
																	<WizardProgressStep
																		key={ progressSteps[ step ].title }
																		currentStep={ currentStep === step }
																		title={ progressSteps[ step ].title }
																		step={ stepIndex + 1 }
																		status={ this.stepStatus( progressSteps, step ) }
																		warning={ progressSteps[ step ].warning }
																		error={ progressSteps[ step ].error }
																		stepKey={ step }
																	/>
																);
															} ) }
														</div>
													</div>
												}
											</div>
										</div>
										{ showAuthenticateButton &&
											<div className="googlesitekit-setup__footer">
												<div className="mdc-layout-grid">
													<div className="mdc-layout-grid__inner">
														<div className="
															mdc-layout-grid__cell
															mdc-layout-grid__cell--span-12
														">
															<h1 className="googlesitekit-setup__title">
																{ __( 'Authenticate Site Kit', 'google-site-kit' ) }
															</h1>
															<p className="googlesitekit-setup__description">
																{ __( 'Please sign into your Google account to begin.', 'google-site-kit' ) }
															</p>
															<Button
																href="#"
																onClick={ () => {
																	trackEvent( 'plugin_setup', 'signin_with_google' );
																	document.location = connectURL;
																} }
															>{ __( 'Sign in with Google', 'google-site-kit' ) }</Button>
														</div>
													</div>
												</div>
											</div>
										}
									</section>
									{ showVerificationSteps &&
										wizardStepComponent
									}
								</Layout>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default Setup;
