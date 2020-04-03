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
import data, { TYPE_MODULES } from '../../../components/data';

class AdSenseSettings extends Component {
	constructor( props ) {
		super( props );
		const { useSnippet = true } = getModulesData().adsense.settings;

		this.state = {
			useSnippet: !! useSnippet,
			disabled: false,
		};

		this.handleUseSnippetSwitch = this.handleUseSnippetSwitch.bind( this );
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

	render() {
		const {
			useSnippet,
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
							{	__( 'The AdSense code has', 'google-site-kit' ) } {
								useSnippet
									? __( 'been placed on your site.', 'google-site-kit' )
									: __( 'not been placed on your site.', 'google-site-kit' )
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
	switchOnMessage: '',
	switchOffMessage: '',
};

export default AdSenseSettings;
