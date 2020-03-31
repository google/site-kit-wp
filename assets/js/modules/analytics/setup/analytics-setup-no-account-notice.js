/**
 * AnalyticsSetup component.
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
import {
	Select,
	Option,
	Input,
	TextField,
} from 'SiteKitCore/material-components';
import Button from 'GoogleComponents/button';
import classnames from 'classnames';
import ProgressBar from 'GoogleComponents/progress-bar';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
class AnalyticsSetupNoAccountNotice extends Component {
	constructor( props ) {
		super( props );

		const { siteName, siteURL, timezone } = global.googlesitekit.admin;

		this.state = {
			accountName: siteName,
			propertyName: siteURL,
			profileName: 'All website traffic',
			timezone,
			validationIssues: {},
			isSubmitting: false,
		};

		this.handleInputChange = this.handleInputChange.bind( this );
		this.getTimezoneSelector = this.getTimezoneSelector.bind( this );
		this.handleSubmit = this.handleSubmit.bind( this );
	}

	handleInputChange( e, inputName ) {
		this.setState( { [ inputName ]: e.target.value } );
		const { validationIssues } = this.state;

		// If the field is empty, it is invalid.
		validationIssues[ inputName ] = '' === e.target.value;

		this.setState( { validationIssues } );
	}

	async handleSubmit( e ) {
		if ( e ) {
			e.preventDefault();
		}
		this.setState( { isSubmitting: true } );
	}

	// Build the timezone selector and cache it for re-renders.
	getTimezoneSelector() {
		if ( this.timezoneData ) {
			return this.timezoneData;
		}
		const { timezones } = global.googlesitekit.admin;
		const {
			timezone,
		} = this.state;
		this.timezoneData = (
			<Select
				className="googlesitekit-analytics__select-timezone"
				name="timezone"
				style={ { minWidth: '240px' } /*todo: move to css */ }
				enhanced
				value={ timezone }
				onChange={ ( e ) => {
					this.handleInputChange( e, 'timezone' );
				} }
				label={ __( 'Timezone', 'google-site-kit' ) }
				outlined
			>
				{ timezones && timezones
					.map( ( aTimezone, id ) =>
						<Option
							key={ id }
							value={ aTimezone.value }
						>
							{ aTimezone.name }
						</Option>
					) }
			</Select>
		);
		return this.timezoneData;
	}

	render() {
		const {
			accountName,
			propertyName,
			profileName,
			validationIssues,
			isSubmitting,
		} = this.state;

		const errorCode = '';

		// Disable the submit button if there are validation errors, and while submission is in progress.
		const buttonDisabled = validationIssues.accountName || validationIssues.propertyName || validationIssues.profileName || isSubmitting;

		return (
			<Fragment>
				<div className="googlesitekit-setup-module">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
							<h2>
								{ __( 'Oops...', 'google-site-kit' ) }
							</h2>
							<p>
								{ __( 'Looks like you need to set up an account to use Analytics. Site Kit can provision a new account for you.', 'google-site-kit' ) }
							</p>
							<p>
								{ __( 'Confirm your account details:', 'google-site-kit' ) }
							</p>
							{
								isSubmitting
									? <ProgressBar />
									: <div className="googlesitekit-setup-module__inputs">
										<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
											<TextField
												className={ classnames(
													'mdc-text-field',
													{ 'mdc-text-field--error': errorCode || validationIssues.accountName }
												) }
												label={ __( 'Account', 'google-site-kit' ) }
												name="account"
												onChange={ ( e ) => {
													this.handleInputChange( e, 'accountName' );
												} }
												outlined
												required
											>
												<Input
													name="account"
													value={ accountName }
												/>
											</TextField>
										</div>
										<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
											<TextField
												className={ classnames(
													'mdc-text-field',
													{ 'mdc-text-field--error': errorCode || validationIssues.propertyName }
												) }
												label={ __( 'Property', 'google-site-kit' ) }
												name="property"
												onChange={ ( e ) => {
													this.handleInputChange( e, 'propertyName' );
												} }
												outlined
												required
											>
												<Input
													name="property"
													value={ propertyName }
												/>
											</TextField>
										</div>
										<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
											<TextField
												className={ classnames(
													'mdc-text-field',
													{ 'mdc-text-field--error': errorCode || validationIssues.profileName }
												) }
												label={ __( 'Profile', 'google-site-kit' ) }
												name="profile"
												onChange={ ( e ) => {
													this.handleInputChange( e, 'profileName' );
												} }
												outlined
												required
											>
												<Input
													name="profile"
													value={ profileName }
												/>
											</TextField>
										</div>
										<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
											{ this.getTimezoneSelector() }
										</div>
									</div>
							}
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
								<Button
									disabled={ buttonDisabled }
									onClick={ this.handleSubmit }
								>
									{ __( 'Create Account', 'google-site-kit' ) }
								</Button>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default AnalyticsSetupNoAccountNotice;
