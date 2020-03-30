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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { trackEvent } from 'GoogleUtil';
class AnalyticsSetupNoAccountNotice extends Component {
	constructor( props ) {
		super( props );

		const { siteName, siteURL, timezone } = global.googlesitekit.admin;

		this.state = {
			accountName: siteName,
			propertyName: siteURL,
			profileName: 'All website traffic',
			timezone,
		};

		this.handleInputChange = this.handleInputChange.bind( this );
	}

	handleInputChange( e, inputName ) {
		this.setState( { [ inputName ]: e.target.value } );
	}

	async handleSubmit( e ) {
		if ( e ) {
			e.preventDefault();
		}
		trackEvent( 'analytics_setup', 'new_account_setup_clicked', '' );
	}

	render() {
		const allTimezones = [];
		const {
			accountName,
			propertyName,
			profileName,
			timezone,
		} = this.state;
		const accountValidated = true;
		const propertyValidated = true;
		const profileValidated = true;
		const timezoneValidated = true;
		const errorCode = '';

		return (
			<Fragment>
				<div className="googlesitekit-setup-module">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-6">
							<h2>
								{ __( 'Oops...', 'google-site-kit' ) }
							</h2>
							<p>
								{ __( 'Looks like you need to set up an account to use Analytics. Site Kit can provision a new account for you.', 'google-site-kit' ) }
							</p>
							<p>
								{ __( 'Confirm your account details:', 'google-site-kit' ) }
							</p>
							<div className="googlesitekit-setup-module__inputs">
								<TextField
									className={ classnames(
										'mdc-text-field',
										{ 'mdc-text-field--error': errorCode || ! accountValidated }
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
								<TextField
									className={ classnames(
										'mdc-text-field',
										{ 'mdc-text-field--error': errorCode || ! propertyValidated }
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
								<TextField
									className={ classnames(
										'mdc-text-field',
										{ 'mdc-text-field--error': errorCode || ! profileValidated }
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
							<div className="googlesitekit-setup-module__inputs">
								<Select
									className={ classnames(
										'mdc-text-field googlesitekit-analytics__select-timezone',
										{ 'mdc-text-field--error': errorCode || ! timezoneValidated }
									) }
									name="timezone"
									value={ timezone }
									onChange={ ( e ) => {
										this.handleInputChange( e, 'timezone' );
									} }
									label={ __( 'Timezone', 'google-site-kit' ) }
									outlined
								>
									{ allTimezones
										.map( ( account, id ) =>
											<Option
												key={ id }
												value={ account.id }
											>
												{ account.name }
											</Option>
										) }
								</Select>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default AnalyticsSetupNoAccountNotice;
