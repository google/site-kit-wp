/**
 * SetupUsingGCP component.
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
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withSelect } from 'googlesitekit-data';
import { set } from 'googlesitekit-api';
import { Button } from 'googlesitekit-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	PERMISSION_SETUP,
	CORE_USER,
} from '../../googlesitekit/datastore/user/constants';
import { Cell, Grid, Row } from '../../material-components';
import Header from '../Header';
import Layout from '../layout/Layout';
import { clearCache } from '../../googlesitekit/api/cache';
import STEPS from './wizard-steps';
import WizardProgressStep from './wizard-progress-step';
import HelpMenu from '../help/HelpMenu';

class SetupUsingGCP extends Component {
	constructor( props ) {
		super( props );

		const { connectURL } = global._googlesitekitLegacyData.admin;

		const {
			isAuthenticated,
			hasSearchConsoleProperty,
			isSiteKitConnected,
			isVerified,
			needReauthenticate,
		} = global._googlesitekitLegacyData.setup;

		this.state = {
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
		this.onButtonClick = this.onButtonClick.bind( this );
	}

	async resetAndRestart() {
		await set( 'core', 'site', 'reset' );
		await clearCache();

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

		return (
			isSiteKitConnected &&
			isAuthenticated &&
			isVerified &&
			hasSearchConsoleProperty &&
			completeSetup
		);
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

	onButtonClick() {
		const { connectURL } = this.state;

		document.location = connectURL;
	}

	render() {
		const {
			isAuthenticated,
			isVerified,
			needReauthenticate,
			hasSearchConsoleProperty,
			connectURL,
			isSiteKitConnected,
		} = this.state;

		const { canSetup, redirectURL } = this.props;

		if ( this.isSetupFinished() ) {
			delay(
				function () {
					global.location.replace( redirectURL );
				},
				500,
				'later'
			);
		}

		const progressSteps = this.getApplicableSteps();
		const currentStep = this.currentStep( progressSteps );

		const WizardStepComponent = progressSteps[ currentStep ].Component;
		const wizardStepComponent = (
			<WizardStepComponent
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
				resetAndRestart={
					progressSteps.clientCredentials
						? this.resetAndRestart
						: undefined
				}
			/>
		);

		const showVerificationSteps = canSetup;
		const showAuthenticateButton =
			! showVerificationSteps && ! isAuthenticated;

		return (
			<Fragment>
				<Header>
					<HelpMenu />
				</Header>
				<div className="googlesitekit-wizard">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<Layout>
									<section className="googlesitekit-wizard-progress">
										<Grid>
											<Row>
												{ showVerificationSteps && (
													<Cell size={ 12 }>
														<div className="googlesitekit-wizard-progress__steps">
															{ Object.keys(
																progressSteps
															).map(
																(
																	step,
																	stepIndex
																) => {
																	return (
																		<WizardProgressStep
																			key={
																				progressSteps[
																					step
																				]
																					.title
																			}
																			currentStep={
																				currentStep ===
																				step
																			}
																			title={
																				progressSteps[
																					step
																				]
																					.title
																			}
																			step={
																				stepIndex +
																				1
																			}
																			status={ this.stepStatus(
																				progressSteps,
																				step
																			) }
																			warning={
																				progressSteps[
																					step
																				]
																					.warning
																			}
																			error={
																				progressSteps[
																					step
																				]
																					.error
																			}
																			stepKey={
																				step
																			}
																		/>
																	);
																}
															) }
														</div>
													</Cell>
												) }
											</Row>
										</Grid>
										{ showAuthenticateButton && (
											<div className="googlesitekit-setup__footer">
												<Grid>
													<Row>
														<Cell size={ 12 }>
															<h1 className="googlesitekit-setup__title">
																{ __(
																	'Authenticate Site Kit',
																	'google-site-kit'
																) }
															</h1>
															<p className="googlesitekit-setup__description">
																{ __(
																	'Please sign into your Google account to begin.',
																	'google-site-kit'
																) }
															</p>
															<Button
																href="#"
																onClick={
																	this
																		.onButtonClick
																}
															>
																{ _x(
																	'Sign in with Google',
																	'Service name',
																	'google-site-kit'
																) }
															</Button>
														</Cell>
													</Row>
												</Grid>
											</div>
										) }
									</section>
									{ showVerificationSteps &&
										wizardStepComponent }
								</Layout>
							</Cell>
						</Row>
					</Grid>
				</div>
			</Fragment>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		return {
			canSetup: select( CORE_USER ).hasCapability( PERMISSION_SETUP ),
			redirectURL: select( CORE_SITE ).getAdminURL(
				'googlesitekit-dashboard',
				{
					notification: 'authentication_success',
				}
			),
		};
	} )
)( SetupUsingGCP );
