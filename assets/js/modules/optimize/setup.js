/**
 * OptimizeSetup component.
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
import Button from 'GoogleComponents/button';
import Link from 'GoogleComponents/link';
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import SvgIcon from 'GoogleUtil/svg-icon';
import PropTypes from 'prop-types';
import {
	validateJSON,
	validateOptimizeID,
	toggleConfirmModuleSettings,
} from 'GoogleUtil';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { TextField, Input, HelperText } from '../../material-components';

class OptimizeSetup extends Component {
	constructor( props ) {
		super( props );

		const {
			optimizeID,
			ampExperimentJSON,
		} = global.googlesitekit.modules.optimize.settings;

		const {
			settings: analyticsSettings,
		} = global.googlesitekit.modules.analytics || {};

		const {
			active: gtmActive,
			settings: gtmSettings,
		} = global.googlesitekit.modules.tagmanager || {};

		const analyticsUseSnippet = analyticsSettings ? analyticsSettings.useSnippet : false;
		const gtmUseSnippet = gtmActive && gtmSettings ? gtmSettings.useSnippet : false;

		this.state = {
			optimizeID: optimizeID || '',
			analyticsUseSnippet,
			gtmUseSnippet,
			errorCode: false,
			errorMsg: '',
			ampExperimentJSON: ampExperimentJSON || '',
			ampExperimentJSONValidated: true,
			OptimizeIDValidated: true,
		};

		this.handleOptimizeIDEntry = this.handleOptimizeIDEntry.bind( this );
		this.handleSubmit = this.handleSubmit.bind( this );
		this.renderInstructionInfo = this.renderInstructionInfo.bind( this );
		this.handleAMPOptimizeEntry = this.handleAMPOptimizeEntry.bind( this );
	}

	componentDidMount() {
		this._isMounted = true;

		// Handle save hook from the settings page.
		addFilter( 'googlekit.SettingsConfirmed',
			'googlekit.OptimizeSettingsConfirmed',
			( chain, module ) => {
				if ( 'optimize' !== module.replace( '-module', '' ) ) {
					return chain;
				}
				const { isEditing } = this.props;
				if ( isEditing ) {
					return this.handleSubmit();
				}
			} );

		this.toggleConfirmChangesButton();
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeFilter( 'googlekit.SettingsConfirmed', 'googlekit.OptimizeSettingsConfirmed' );
	}

	componentDidUpdate() {
		this.toggleConfirmChangesButton();
	}

	/**
	 * Toggle confirm changes button disable/enabble depending on the changed settings.
	 */
	toggleConfirmChangesButton() {
		if ( ! this.props.isEditing ) {
			return;
		}

		const settingsMapping = {
			optimizeID: 'optimizeID',
			ampExperimentJSON: 'ampExperimentJSON',
		};

		toggleConfirmModuleSettings( 'optimize', settingsMapping, this.state );
	}

	async handleSubmit() {
		const {
			optimizeID,
			ampExperimentJSON,
			OptimizeIDValidated,
		} = this.state;
		const { finishSetup } = this.props;

		if ( ! OptimizeIDValidated || 0 === optimizeID.length ) {
			return false;
		}

		const optimizeAccount = {
			optimizeID,
			ampExperimentJSON,
		};

		return await data.set( TYPE_MODULES, 'optimize', 'settings', optimizeAccount ).then( () => {
			if ( finishSetup ) {
				finishSetup();
			}

			global.googlesitekit.modules.optimize.settings.optimizeID = optimizeID;

			if ( this._isMounted ) {
				this.setState( {
					isSaving: false,
				} );
			}
		} ).catch( ( err ) => {
			if ( this._isMounted ) {
				this.setState( {
					errorCode: true,
					errorMsg: err.errorMsg,
				} );
			}
		} );
	}

	handleOptimizeIDEntry( e ) {
		const validOptimizeID = validateOptimizeID( e.target.value );
		if ( this._isMounted ) {
			this.setState( {
				optimizeID: e.target.value,
				OptimizeIDValidated: validOptimizeID,
			} );
		}
	}

	handleAMPOptimizeEntry( e ) {
		const validJSON = validateJSON( e.target.value );

		if ( this._isMounted ) {
			this.setState( {
				ampExperimentJSON: e.target.value,
				ampExperimentJSONValidated: validJSON,
			} );
		}
	}

	renderInfo() {
		const {
			optimizeID,
		} = this.state;

		return (
			<Fragment>
				{
					optimizeID
						? <div>{ __( 'Your Optimize Container ID', 'google-site-kit' ) }: <strong>{ optimizeID }</strong></div>
						: <div>{ __( 'Optimize Container ID missing, press "edit" to add', 'google-site-kit' ) }.</div>
				}
			</Fragment>
		);
	}

	renderInstructionInfo() {
		const {
			analyticsUseSnippet,
			gtmUseSnippet,
			optimizeID,
		} = this.state;

		// If we don't use auto insert gtag, but use auto insert gtm. Show instruction of how to implement it on GTM.
		if ( ! analyticsUseSnippet && gtmUseSnippet ) {
			return (
				<Fragment>
					<p>{ __( 'You are using auto insert snippet with Tag Manager', 'google-site-kit' ) }</p>
					<p><a href="https://support.google.com/optimize/answer/6314801">{ __( 'Click here', 'google-site-kit' ) }</a> { __( 'for how to implement Optimize tag through your Tag Manager', 'google-site-kit' ) }</p>
				</Fragment>
			);
		}

		if ( ! analyticsUseSnippet ) {
			return (
				<Fragment>
					<p>{ __( 'You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below:', 'google-site-kit' ) }</p>
					<pre>
						ga(&quot;require&quot;, &quot;{ optimizeID ? optimizeID : 'GTM-XXXXXXX' }&quot;);
					</pre>
					<p><a href="https://support.google.com/optimize/answer/6262084">{ __( 'Click here', 'google-site-kit' ) }</a> { __( 'for how to implement Optimize tag in Google Analytics Code Snippet', 'google-site-kit' ) }</p>
				</Fragment>
			);
		}

		return null;
	}

	renderAMPSnippet() {
		const {
			analyticsUseSnippet,
			ampExperimentJSON,
			ampExperimentJSONValidated,
		} = this.state;

		const { ampEnabled } = global.googlesitekit.admin;

		if ( ! analyticsUseSnippet || ! ampEnabled ) {
			return null;
		}

		return (
			<Fragment>
				<p>{ __( 'Please input your AMP experiment settings in JSON format below.', 'google-site-kit' ) } <Link href="https://developers.google.com/optimize/devguides/amp-experiments" external inherit>{ __( 'Learn More.', 'google-site-kit' ) }</Link></p>
				<TextField
					className={ classnames(
						'mdc-text-field',
						{ 'mdc-text-field--error': ! ampExperimentJSONValidated }
					) }
					name="amp-experiment"
					onChange={ this.handleAMPOptimizeEntry }
					textarea
				>
					<Input
						inputType="textarea"
						value={ null === ampExperimentJSON ? '' : ampExperimentJSON }
					/>
				</TextField>
				{ ! ampExperimentJSONValidated &&
				<p className="googlesitekit-error-text">{ __( 'Error: AMP experiment settings are not in a valid JSON format.', 'google-site-kit' ) }</p>
				}
			</Fragment>
		);
	}

	renderForm() {
		const {
			optimizeID,
			errorCode,
			errorMsg,
			OptimizeIDValidated,
		} = this.state;

		return (
			<Fragment>
				<p>{ __( 'Please copy and paste your Optimize ID to complete your setup.', 'google-site-kit' ) } <Link href="https://support.google.com/optimize/answer/6211921" external inherit>{ __( 'You can locate this here.', 'google-site-kit' ) }</Link></p>

				{
					errorCode && 0 < errorMsg.length &&
					<p className="googlesitekit-error-text">
						{ __( 'Error:', 'google-site-kit' ) } { errorMsg }
					</p>
				}

				<div className="googlesitekit-setup-module__inputs">
					<TextField
						className={ classnames(
							'mdc-text-field',
							{ 'mdc-text-field--error': errorCode || ! OptimizeIDValidated }
						) }
						label={ __( 'Optimize Container ID', 'google-site-kit' ) }
						name="optimizeID"
						onChange={ this.handleOptimizeIDEntry }
						helperText={ <HelperText>{ __( 'Format: GTM-XXXXXXX.', 'google-site-kit' ) }</HelperText> }
						outlined
						required
					>
						<Input
							value={ optimizeID }
						/>
					</TextField>
				</div>

				{ ! OptimizeIDValidated &&
					<p className="googlesitekit-error-text">{ __( 'Error: Not a valid Optimize ID.', 'google-site-kit' ) }</p>
				}

				{
					this.renderAMPSnippet()
				}

				{
					this.renderInstructionInfo()
				}
			</Fragment>
		);
	}

	render() {
		const {
			onSettingsPage,
			isEditing,
		} = this.props;

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--optimize">
				{
					! onSettingsPage &&
					<Fragment>
						<div className="googlesitekit-setup-module__logo">
							<SvgIcon id="optimize" width="33" height="33" />
						</div>
						<h2 className="
									googlesitekit-heading-3
									googlesitekit-setup-module__title
								">
							{ _x( 'Optimize', 'Service name', 'google-site-kit' ) }
						</h2>
					</Fragment>
				}

				{ isEditing && this.renderForm() }

				{ ! isEditing && this.renderInfo() }

				{
					! onSettingsPage &&
					<div className="googlesitekit-setup-module__action">
						<Button onClick={ this.handleSubmit }>{ __( 'Configure Optimize', 'google-site-kit' ) }</Button>
					</div>
				}
			</div>
		);
	}
}

OptimizeSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	finishSetup: PropTypes.func,
	isEditing: PropTypes.bool,
};

OptimizeSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default OptimizeSetup;
