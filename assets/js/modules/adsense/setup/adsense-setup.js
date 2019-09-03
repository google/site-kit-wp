/**
 * AdSenseSetupWidget component.
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
import data, { TYPE_MODULES } from 'GoogleComponents/data';
/**
 * Internal dependencies
 */
import AdSenseSetupAuthFlowWidget from './setup-auth-flow-widget';
import Spinner from 'GoogleComponents/spinner';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class AdSenseSetupWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isLoading: true,
			error: false,
			message: '',
			accounts: [],
			accountStatus: '',
		};
	}

	componentDidMount() {
		this.getAccounts();
	}

	async getAccounts() {
		try {
			const responseData = await data.get( TYPE_MODULES, 'adsense', 'accounts' );

			/**
			 * Defines the account status. Possible values:
			 * no-account, incomplete, under-verification, denied, completed.
			 */
			let accountStatus = '';

			if ( ! responseData || ! responseData.length ) {
				accountStatus = 'no-account';
			}

			const accounts = responseData;

			this.setState( {
				isLoading: false,
				accountStatus,
				accounts,
				error: false,
			} );
		} catch ( err ) {
			this.setState( {
				isLoading: false,
				error: err.code,
				message: err.message,
			} );
		}
	}

	renderErrorMessage() {
		const {
			error,
			message,
		} = this.state;

		return error && 0 < message.length ?
			<div className="googlesitekit-error-text">
				<p>{ __( 'Error:', 'google-site-kit' ) } { message }</p>
			</div> : null;
	}

	render() {
		const {
			isLoading,
			accounts,
			accountStatus,
		} = this.state;

		return (
			<Fragment>
				<div className="googlesitekit-module-page googlesitekit-module-page--adsense">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							{ isLoading ? <Spinner isSaving={ isLoading } /> : <AdSenseSetupAuthFlowWidget accountStatus={ accountStatus } accounts={ accounts } /> }
							{ ! isLoading ? this.renderErrorMessage() : null }
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default AdSenseSetupWidget;
