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
 * Internal dependencies
 */
import { getAdSenseAccountStatus } from '../util';
import ProgressBar from 'GoogleComponents/progress-bar';
import AdSenseSetupInstructions from '../setup/adsense-setup-instructions';
import AdSenseInProcessStatus from './adsense-in-process-status';
import {
	getExistingTag,
} from 'GoogleUtil';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class AdSenseModuleStatus extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			loadStatus: __( 'Loading…', 'google-site-kit' ),
			existingTag: false,
		};
		this.updateLoadStatus = this.updateLoadStatus.bind( this );
		this.handleComponentRender = this.handleComponentRender.bind( this );
		this.continueSetup = this.continueSetup.bind( this );
		this.goBack = this.goBack.bind( this );
	}

	// Update the load status as the user status is determined.
	updateLoadStatus( loadStatus ) {
		this.setState( { ...this.state, loadStatus } );
	}

	async componentDidMount() {
		let existingTag = await getExistingTag( 'adsense' );

		this.setState( { existingTag } );

		getAdSenseAccountStatus( this.updateLoadStatus, existingTag ).then( ( results ) => {
			this.setState( results );
		} );
	}

	/**
	 * If setup requires a continue step, the method repopulates state with the new data.
	 */
	continueSetup( continueData ) {
		continueData.existingState = this.state;
		this.setState( continueData );
	}

	/**
	 * Go back to the previous (existing) state.
	 */
	goBack() {
		const { existingState } = this.state;
		if ( existingState ) {
			existingState.existingState = false;
			this.setState( existingState );
		}
	}

	handleComponentRender() {
		const {
			accountStatus,
			loadStatus,
		} = this.state;

		if ( ! googlesitekit.canAdsRun && ! googlesitekit.modules.adsense.setupComplete ) {
			return (
				<Fragment>
					<div className="googlesitekit-settings-module-warning">
						<SvgIcon id="error" height="20" width="23" /> { __( 'Ad blocker detected, you need to disable it in order to setup AdSense.', 'google-site-kit' ) }
					</div>
				</Fragment>
			);
		}

		if ( ! accountStatus ) {
			return (
				<Fragment>
					{ loadStatus }
					<ProgressBar />
				</Fragment>
			);
		}
		if ( 'account-pending-review' === accountStatus ) {
			return (
				<AdSenseInProcessStatus status="incomplete" />
			);
		}

		if ( 'account-required-action' === accountStatus ) {
			return (
				<AdSenseInProcessStatus status="requiredAction" />
			);
		}

		if ( 'ads-display-pending' === accountStatus ) {
			return (
				<AdSenseInProcessStatus status="adsDisplayPending" />
			);
		}

		return (
			<AdSenseSetupInstructions
				{ ...this.state }
				continueSetup={ this.continueSetup }
				goBack={ this.goBack }
			/>
		);
	}

	render() {
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
						{ __( 'AdSense', 'google-site-kit' ) }
					</h2>
				</div>
				<div className="googlesitekit-setup-module__step">
					{ this.handleComponentRender() }
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
