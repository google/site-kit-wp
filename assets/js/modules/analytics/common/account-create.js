/**
 * AnalyticsSetup component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import Data from 'googlesitekit-data';
import { __ } from '@wordpress/i18n';
import { useState, Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Select,
	Option,
	Input,
	TextField,
} from '../../../material-components';
import Button from '../../../components/button';
import classnames from 'classnames';
import ProgressBar from '../../../components/progress-bar';
import { STORE_NAME } from '../datastore';
const { useDispatch } = Data;

// Cache the complicated timezone dropdown.
let timezoneData = false;

const AccountCreate = () => {
	const { createAccount } = useDispatch( STORE_NAME );

	const handleSubmit = useCallback( ( accountName, propertyName, profileName, timezone ) => {
		createAccount( {
			accountName,
			propertyName,
			profileName,
			timezone,
		} ).then( () => {
			setIsSubmitting( false );
		} );
	} );

	// Build the timezone selector and cache it for re-renders.
	const getTimezoneSelector = ( { timezone, setTimezone, validationIssues, setValidationIssues } ) => {
		if ( timezoneData ) {
			return timezoneData;
		}
		const { timezones } = global.googlesitekit.admin;

		timezoneData = (
			<Select
				className="googlesitekit-analytics__select-timezone"
				name="timezone"
				style={ { minWidth: '240px' } /*todo: move to css */ }
				enhanced
				value={ timezone }
				onChange={ ( e ) => {
					validationIssues.timezone = '' === e.target.value;
					setValidationIssues( validationIssues );
					setTimezone( e.target.value );
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
		return timezoneData;
	};

	const { siteName, siteURL, timezone: tz } = global.googlesitekit.admin;

	const [ accountName, setAccountName ] = useState( siteName );
	const [ propertyName, setPropertyName ] = useState( siteURL );
	const [ profileName, setProfileName ] = useState( __( 'All website traffic', 'google-site-kit' ) );
	const [ validationIssues, setValidationIssues ] = useState( {} );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ timezone, setTimezone ] = useState( tz );

	const errorCode = '';

	// Disable the submit button if there are validation errors, and while submission is in progress.
	const buttonDisabled = validationIssues.accountName || validationIssues.propertyName || validationIssues.profileName || isSubmitting;

	return (
		<Fragment>
			<div className="googlesitekit-setup-module">
				<div className="mdc-layout-grid__inner">
					<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
						<h2>
							{ __( 'Set up new Analytics account', 'google-site-kit' ) }
						</h2>
						<p>
							{ __( 'Looks like you need to set up an account to use Analytics. Site Kit can provision a new account for you.', 'google-site-kit' ) }
						</p>
						<br />
						<div>
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
													validationIssues.timezone = '' === e.target.value;
													setValidationIssues( validationIssues );
													setAccountName( e.target.value );
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
													validationIssues.proper = '' === e.target.value;
													setValidationIssues( validationIssues );
													setPropertyName( e.target.value );
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
													validationIssues.profile = '' === e.target.value;
													setValidationIssues( validationIssues );
													setProfileName( e.target.value );
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
											{ getTimezoneSelector( { timezone, setTimezone, validationIssues, setValidationIssues } ) }
										</div>
									</div>
							}
						</div>
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-2">
							<Button
								disabled={ buttonDisabled }
								onClick={ () => {
									setIsSubmitting( true );
									handleSubmit( accountName, propertyName, profileName, timezone );
								} }
							>
								{ __( 'Create Account', 'google-site-kit' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default AccountCreate;
