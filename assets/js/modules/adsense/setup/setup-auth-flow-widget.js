/**
 * AdSenseSetupAuthFlowWidget component.
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

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class AdSenseSetupAuthFlowWidget extends Component {
	constructor( props ) {
		super( props );

		this.renderAccountSetup = this.renderAccountSetup.bind( this );
	}

	static createNewAccount( e ) {
		e.preventDefault();

		const { signupURL } = googlesitekit.modules.adsense;

		window.open( signupURL, '_blank' );
	}

	renderAccountSetup() {
		const { accountStatus } = this.props;

		if ( 'no-account' === accountStatus ) {
			return <Button onClick={ AdSenseSetupAuthFlowWidget.createNewAccount }>{ __( 'Sign up for AdSense', 'google-site-kit' ) }</Button>;
		}

		/* @TODO: USER HAS EXISTING ACCOUNT THAT IS INCOMPLETE */
		/* @TODO: USER ACCOUNT VERIFICATION REVIEW */
		/* @TODO: USER ACCOUNT DENIED/PROBLEM */
	}

	render() {
		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					{ this.renderAccountSetup() }
				</div>
			</Fragment>
		);
	}
}

export default AdSenseSetupAuthFlowWidget;
