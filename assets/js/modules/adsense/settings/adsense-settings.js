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
import Switch from 'GoogleComponents/switch';
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import PropTypes from 'prop-types';
import {
	sendAnalyticsTrackingEvent,
	toggleConfirmModuleSettings,
} from 'GoogleUtil';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;
const {
	removeFilter,
	addFilter,
} = wp.hooks;

class AdSenseSettings extends Component {
	constructor( props ) {
		super( props );
		const { adsenseTagEnabled = true } = googlesitekit.modules.adsense.settings;

		this.state = {
			adsenseTagEnabled: !! adsenseTagEnabled,
			disabled: false,
		};

		this.handleadsenseTagEnabledSwitch = this.handleadsenseTagEnabledSwitch.bind( this );
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
		const { adsenseTagEnabled } = this.state;
		if ( this._isMounted ) {
			this.setState( {
				adsenseTagEnabled,
			} );
		}

		const toSave = {
			adsenseTagEnabled: adsenseTagEnabled || false,
		};

		// Reset the localized variable.
		if ( googlesitekit.modules.adsense.settings ) {
			googlesitekit.modules.adsense.settings.adsenseTagEnabled = adsenseTagEnabled;
		}

		return data.set( TYPE_MODULES, 'adsense', 'adsense-tag-enabled', toSave ).then( ( res ) => res ).catch( ( e ) => e );
	}

	handleadsenseTagEnabledSwitch( ) {
		const { saveOnChange } = this.props;
		let { adsenseTagEnabled } = this.state;
		adsenseTagEnabled = ! adsenseTagEnabled;

		if ( this._isMounted ) {
			this.setState( {
				adsenseTagEnabled,
			} );
		}

		// Track the event.
		sendAnalyticsTrackingEvent( 'adsense_setup', adsenseTagEnabled ? 'adsense_tag_enabled' : 'adsense_tag_disabled' );

		if ( saveOnChange ) {
			data.set( TYPE_MODULES, 'adsense', 'adsense-tag-enabled', { adsenseTagEnabled } ).then( ( res ) => res ).catch( ( e ) => e );
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
			adsenseTagEnabled: 'adsenseTagEnabled',
		};

		toggleConfirmModuleSettings( 'adsense', settingsMapping, this.state );
	}

	render() {
		const {
			adsenseTagEnabled,
		} = this.state;
		const {
			isEditing,
			switchLabel,
			switchOnMessage,
			switchOffMessage,
		} = this.props;

		return (
			<Fragment>
				{
					isEditing ?
						<Fragment>
							<div className="googlesitekit-setup-module__switch">
								<Switch
									id="enableAutoAds"
									label={ switchLabel }
									onClick={ this.handleadsenseTagEnabledSwitch }
									checked={ adsenseTagEnabled }
									hideLabel={ false }
								/> <span className="googlesitekit-recommended">{ __( 'RECOMMENDED', 'google-site-kit' ) }</span>
							</div>

							{
								adsenseTagEnabled && switchOnMessage &&
								<div className="googlesitekit-settings-notice googlesitekit-settings-notice--suggestion">
									<div className="googlesitekit-settings-notice__text">
										{ switchOnMessage }
									</div>
								</div>
							}
							{
								! adsenseTagEnabled && switchOffMessage &&
								<div className="googlesitekit-settings-notice">
									<div className="googlesitekit-settings-notice__text">
										{ switchOffMessage }
									</div>
								</div>
							}
						</Fragment> :
						<Fragment>
							{	__( 'The AdSense code has', 'google-site-kit' ) } {
								adsenseTagEnabled ?
									__( 'been placed on your site.', 'google-site-kit' ) :
									__( 'not been placed on your site.', 'google-site-kit' )
							}
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
	switchLabel: __( 'Let Site Kit place code on your site', 'google-site-kit' ),
	switchOnMessage: '',
	switchOffMessage: '',
};

export default AdSenseSettings;
