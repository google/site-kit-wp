/**
 * AdSenseModuleStatus component.
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
import SvgIcon from 'GoogleUtil/svg-icon';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdSenseSetupInstructions from '../setup/adsense-setup-instructions';
import AdSenseInProcessStatus from './adsense-in-process-status';
import { getExistingTag, getModulesData } from 'GoogleUtil';
import { getAdSenseAccountStatus, propsFromAccountStatus } from '../util';

class AdSenseModuleStatus extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			accountStatus: undefined,
			loadingMessage: __( 'Loading…', 'google-site-kit' ),
			instructionProps: {},
		};
	}

	async componentDidMount() {
		await this.updateAccountStatus();
	}

	componentDidUpdate( previousProps, previousState ) {
		const { accountStatus } = this.state;

		if ( previousState.accountStatus !== accountStatus ) {
			const adSenseSetupInstructionsProps = propsFromAccountStatus( accountStatus );
			this.setState( { instructionProps: adSenseSetupInstructionsProps } );
		}
	}

	/**
	 * If setup requires a continue step, the method repopulates state with the new data.
	 *
	 * @param {Object} continueData New props to use for instructions.
	 */
	continueSetup( continueData ) {
		const { instructionProps } = this.state;

		continueData.existingState = { ...instructionProps };
		this.setState( { instructionProps: continueData } );
	}

	/**
	 * Go back to the previous (existing) state.
	 */
	goBack() {
		const { instructionProps } = this.state;

		const { existingState } = { ...instructionProps };
		if ( existingState ) {
			existingState.existingState = false;
			this.setState( { instructionProps: existingState } );
		}
	}

	async updateAccountStatus() {
		const existingTag = await getExistingTag( 'adsense' );
		const setLoadingMessage = ( message ) => {
			this.setState( { loadingMessage: message } );
		};

		const { accountStatus, clientID } = await getAdSenseAccountStatus( existingTag, setLoadingMessage );

		this.setState( { accountStatus, clientID } );
	}

	render() {
		const modulesData = getModulesData();
		const { accountStatus, clientID, loadingMessage, instructionProps } = this.state;

		const showInProcess = ! accountStatus || ! modulesData.adsense.setupComplete || [
			'ads-display-pending',
			'account-pending-review',
			'account-required-action',
		].includes( accountStatus );

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
				<div className="googlesitekit-setup-module__step">
					<div className="googlesitekit-setup-module__logo">
						<SvgIcon id="adsense" width="33" height="33" />
					</div>
					<h2 className="
							googlesitekit-heading-3
							googlesitekit-setup-module__title
						">
						{ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
					</h2>
				</div>
				<div className="googlesitekit-setup-module__step">
					{ ! global.googlesitekit.canAdsRun && ! modulesData.adsense.setupComplete && (
						<div className="googlesitekit-settings-module-warning">
							<SvgIcon id="error" height="20" width="23" />
							{ __( 'Ad blocker detected, you need to disable it in order to setup AdSense.', 'google-site-kit' ) }
						</div>
					) }

					{ showInProcess && 'account-connected' !== accountStatus && (
						<AdSenseInProcessStatus
							ctaLink={ instructionProps.ctaLink }
							ctaLinkText={ instructionProps.ctaLinkText }
							header={ instructionProps.statusHeadline }
							subHeader={ instructionProps.statusMessage }
							incomplete={ instructionProps.incomplete }
							required={ instructionProps.required }
							loadingMessage={ ! accountStatus && loadingMessage }
						/>
					) }

					{ global.googlesitekit.canAdsRun && accountStatus && ( modulesData.adsense.setupComplete || 'account-connected' === accountStatus ) && (
						<AdSenseSetupInstructions
							{ ...instructionProps }
							accountStatus={ accountStatus }
							clientID={ clientID }
							continueSetup={ this.continueSetup }
							goBack={ this.goBack }
						/>
					) }
				</div>
			</div>
		);
	}
}

AdSenseModuleStatus.propTypes = {
	status: PropTypes.string,
	module: PropTypes.string,
};

export default AdSenseModuleStatus;
