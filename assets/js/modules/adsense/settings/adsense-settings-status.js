/**
 * AdSenseSettingsStatus component.
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
	getSiteKitAdminURL,
} from 'GoogleUtil';
import Link from 'GoogleComponents/link';

const { Component } = wp.element;
const { __ } = wp.i18n;

class AdSenseSettingsStatus extends Component {
	render() {
		const {
			slug,
			screenId,
			OriginalComponent,
		} = this.props;

		const { accountStatus } = googlesitekit.modules.adsense.settings;

		if ( ! accountStatus || 'adsense' !== slug ) {
			return <OriginalComponent { ...this.props } />;
		}

		// Handle the pending status.
		if ( 'account-pending-review' === accountStatus || 'ads-display-pending' === accountStatus ) { /*eslint camelcase: 0*/
			return (
				<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
					{ __( 'Site Kit has placed the code on your site, ', 'google-site-kit' ) }
					<Link
						className="googlesitekit-settings-module__edit-button"
						onClick={ () => {
							const page = screenId ? screenId : 'googlesitekit-dashboard';

							window.location = getSiteKitAdminURL( page, { reAuth: true, slug } );
						} }
						inherit
					>
						{ __( 'check module page', 'google-site-kit' ) }
					</Link>
				</div> );
		}

		return <OriginalComponent { ...this.props } />;
	}
}

export default AdSenseSettingsStatus;
