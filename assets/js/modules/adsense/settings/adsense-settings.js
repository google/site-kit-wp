/**
 * AdSenseSettings component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	trackEvent,
	toggleConfirmModuleSettings,
	getModulesData,
} from '../../../util';
import Switch from '../../../components/switch';
import Link from '../../../components/link';
import data, { TYPE_MODULES } from '../../../components/data';

class AdSenseSettings extends Component {
	constructor( props ) {
		super( props );
		const { useSnippet = true, accountID, accountStatus } = getModulesData().adsense.settings;

		this.state = {
			useSnippet: !! useSnippet,
			disabled: false,
			accountID,
			accountStatus,
		};

		this.handleUseSnippetSwitch = this.handleUseSnippetSwitch.bind( this );
		this.generateAccountStatusLabel = this.generateAccountStatusLabel.bind( this );
	}

	componentDidMount() {
		this._isMounted = true;

		// Handle save hook from the settings page.
		addFilter( 'googlekit.SettingsConfirmed',
			'googlekit.AdSenseSettingsConfirmed',
			( chain, module ) => {
				if ( 'adsense' !== module.replace( '-module', '' ) ) {
					return chain;
				}

				// Return the Promise.
				return this.save();
			} );

		this.toggleConfirmChangesButton();
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeFilter( 'googlekit.SettingsConfirmed', 'googlekit.AdSenseSettingsConfirmed' );
	}

	componentDidUpdate() {
		this.toggleConfirmChangesButton();
	}

	save() {
		const modulesData = getModulesData();

		const { useSnippet } = this.state;
		if ( this._isMounted ) {
			this.setState( {
				useSnippet,
			} );
		}

		const toSave = {
			useSnippet: useSnippet || false,
		};

		// Reset the localized variable.
		if ( modulesData.adsense.settings ) {
			modulesData.adsense.settings.useSnippet = useSnippet;
		}

		return data.set( TYPE_MODULES, 'adsense', 'use-snippet', toSave ).then( ( res ) => res ).catch( ( e ) => e );
	}

	handleUseSnippetSwitch( ) {
		const { saveOnChange } = this.props;
		let { useSnippet } = this.state;
		useSnippet = ! useSnippet;

		if ( this._isMounted ) {
			this.setState( {
				useSnippet,
			} );
		}

		trackEvent( 'adsense_setup', useSnippet ? 'adsense_tag_enabled' : 'adsense_tag_disabled' );

		if ( saveOnChange ) {
			data.set( TYPE_MODULES, 'adsense', 'use-snippet', { useSnippet } ).then( ( res ) => res ).catch( ( e ) => e );
		}
	}

	/**
	 * Toggle confirm changes button disable/enabble depending on the changed settings.
	 */
	toggleConfirmChangesButton() {
		if ( ! this.props.isEditing ) {
			return;
		}

		const settingsMapping = {
			useSnippet: 'useSnippet',
		};

		toggleConfirmModuleSettings( 'adsense', settingsMapping, this.state );
	}

	generateAccountStatusLabel() {
		const { accountStatus } = this.state;
		switch ( accountStatus ) {
			case 'account-connected':
				return __( 'Your account has been approved', 'google-site-kit' );

			case 'account-pending-review':
				return __( 'We’re getting your site ready for ads. This usually takes less than a day, but it can sometimes take a bit longer', 'google-site-kit' );

			case 'account-required-action':
				return __( 'You need to fix some issues before your account is approved. Go to AdSense to find out how to fix it', 'google-site-kit' );

			case 'account-connected-nonmatching':
			case 'ads-display-pending':
			case 'disapproved-account':
			case 'disapproved-account-afc':
			case 'no-account':
			case 'no-account-tag-found':
			case 'account-connected-no-data':
			default:
				return __( 'Your site isn’t ready to show ads yet', 'google-site-kit' );
		}
	}

	render() {
		const {
			useSnippet,
			accountID,
		} = this.state;
		const {
			isEditing,
			switchLabel = __( 'Let Site Kit place code on your site', 'google-site-kit' ),
			switchOnMessage,
			switchOffMessage,
		} = this.props;
		return (
			<Fragment>
				{
					isEditing
						? <Fragment>
							<div className="googlesitekit-setup-module__switch">
								<Switch
									id="enableAutoAds"
									label={ switchLabel }
									onClick={ this.handleUseSnippetSwitch }
									checked={ useSnippet }
									hideLabel={ false }
								/> <span className="googlesitekit-recommended">{ __( 'RECOMMENDED', 'google-site-kit' ) }</span>
							</div>

							{
								useSnippet && switchOnMessage &&
								<div className="googlesitekit-settings-notice googlesitekit-settings-notice--suggestion">
									<div className="googlesitekit-settings-notice__text">
										{ switchOnMessage }
									</div>
								</div>
							}
							{
								! useSnippet && switchOffMessage &&
								<div className="googlesitekit-settings-notice">
									<div className="googlesitekit-settings-notice__text">
										{ switchOffMessage }
									</div>
								</div>
							}
						</Fragment>
						: <Fragment>
							<div className="googlesitekit-settings-module__meta-items">
								<div className="googlesitekit-settings-module__meta-item">
									<p className="googlesitekit-settings-module__meta-item-type">
										{ __( 'Publisher ID', 'google-site-kit' ) }
									</p>
									<h5 className="googlesitekit-settings-module__meta-item-data">
										{ accountID }
									</h5>
								</div>
								<div className="googlesitekit-settings-module__meta-item">
									<p className="googlesitekit-settings-module__meta-item-type">
										{ __( 'Account Status', 'google-site-kit' ) }
									</p>
									<h5 className="googlesitekit-settings-module__meta-item-data">
										{ this.generateAccountStatusLabel() }
									</h5>
								</div>
								<div className="googlesitekit-settings-module__meta-item">
									<p className="googlesitekit-settings-module__meta-item-type">
										{ __( 'Site Status', 'google-site-kit' ) }
									</p>
									<h5 className="googlesitekit-settings-module__meta-item-data">
										<Link
											href="https://www.google.com/adsense/new/sites/my-sites"
											className="googlesitekit-settings-module__cta-button"
											inherit
											external
										>
											{ __( 'Check your site status', 'google-site-kit' ) }
										</Link>
									</h5>
								</div>
							</div>
							<div className="googlesitekit-settings-module__meta-items">
								<div className="googlesitekit-settings-module__meta-item">
									<p className="googlesitekit-settings-module__meta-item-type">
										{ __( 'AdSense Code', 'google-site-kit' ) }
									</p>
									<h5 className="googlesitekit-settings-module__meta-item-data">
										{ useSnippet && __( 'The AdSense code has been placed on your site', 'google-site-kit' ) }
										{ ! useSnippet && __( 'The AdSense code has not been placed on your site', 'google-site-kit' ) }
									</h5>
								</div>
							</div>
						</Fragment>
				}
			</Fragment>
		);
	}
}

AdSenseSettings.propTypes = {
	isEditing: PropTypes.bool,
	accountTagMatch: PropTypes.bool,
	existingTag: PropTypes.oneOfType( [
		PropTypes.bool,
		PropTypes.string,
	] ),
	switchLabel: PropTypes.string,
	switchOnMessage: PropTypes.string,
	switchOffMessage: PropTypes.string,
};

AdSenseSettings.defaultProps = {
	isEditing: false,
	accountTagMatch: false,
	existingTag: false,
	switchOnMessage: '',
	switchOffMessage: '',
};

export default AdSenseSettings;
