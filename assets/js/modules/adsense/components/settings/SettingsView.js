/**
 * AdSense Settings View component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME } from '../../datastore/constants';
import {
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_APPROVED,
} from '../../util/status';
import { ErrorNotices } from '../common';
const { useSelect } = Data;

export default function SettingsView() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const clientID = useSelect( ( select ) => select( STORE_NAME ).getClientID() );
	const accountStatus = useSelect( ( select ) => select( STORE_NAME ).getAccountStatus() );
	const useSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );
	const siteStatusURL = useSelect( ( select ) => select( STORE_NAME ).getServiceAccountManageSitesURL() );
	const webStoriesActive = useSelect( ( select ) => select( CORE_SITE ).isWebStoriesActive() );
	const webStoriesAdUnit = useSelect( ( select ) => select( STORE_NAME ).getWebStoriesAdUnit() );

	let accountStatusLabel;
	switch ( accountStatus ) {
		case ACCOUNT_STATUS_APPROVED:
			accountStatusLabel = __( 'Your account has been approved', 'google-site-kit' );
			break;
		case ACCOUNT_STATUS_PENDING:
		case ACCOUNT_STATUS_GRAYLISTED:
			accountStatusLabel = __( 'We’re getting your site ready for ads. This usually takes less than a day, but it can sometimes take a bit longer', 'google-site-kit' );
			break;
		case ACCOUNT_STATUS_NO_CLIENT:
		case ACCOUNT_STATUS_DISAPPROVED:
			accountStatusLabel = __( 'You need to fix some issues before your account is approved. Go to AdSense to find out how to fix it', 'google-site-kit' );
			break;
		default:
			accountStatusLabel = __( 'Your site isn’t ready to show ads yet', 'google-site-kit' );
	}

	let useSnippetLabel;
	if ( useSnippet ) {
		useSnippetLabel = __( 'The AdSense code has been placed on your site', 'google-site-kit' );
	} else if ( existingTag && existingTag === clientID ) {
		useSnippetLabel = __( 'The AdSense code has been placed by another plugin or theme', 'google-site-kit' );
	} else {
		useSnippetLabel = __( 'The AdSense code has not been placed on your site', 'google-site-kit' );
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
			<ErrorNotices />

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Publisher ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ accountID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account Status', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ accountStatusLabel }
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Site Status', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<Link
							href={ siteStatusURL }
							className="googlesitekit-settings-module__cta-button"
							inherit
							external
						>
							{ __( 'Check your site status', 'google-site-kit' ) }
						</Link>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'AdSense Code', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ useSnippetLabel }
					</p>
				</div>
			</div>

			{ webStoriesActive && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Web Stories Ad Unit', 'google-site-kit' ) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ ! webStoriesAdUnit && <span>{ __( 'None', 'google-site-kit' ) }</span> }
								{ webStoriesAdUnit && <DisplaySetting value={ webStoriesAdUnit } /> }
							</p>
						</div>
					</div>
				</div>
			) }
		</div>
	);
}
