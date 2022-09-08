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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { useFeature } from '../../../../hooks/useFeature';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	trackingExclusionLabels,
	AUTO_ADS_LOGGED_IN_USERS,
	AUTO_ADS_CONTENT_CREATORS,
} from '../common/AutoAdExclusionSwitches';
import { MODULES_ADSENSE } from '../../datastore/constants';
import {
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_APPROVED,
	ACCOUNT_STATUS_NEEDS_ATTENTION,
	ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW,
	ACCOUNT_STATUS_CLIENT_GETTING_READY,
	ACCOUNT_STATUS_READY,
	SITE_STATUS_NEEDS_ATTENTION,
	SITE_STATUS_REQUIRES_REVIEW,
	SITE_STATUS_GETTING_READY,
	SITE_STATUS_READY,
	SITE_STATUS_READY_NO_AUTO_ADS,
} from '../../util/status';
import { ErrorNotices } from '../common';
const { useSelect } = Data;

export default function SettingsView() {
	const adsenseSetupV2Enabled = useFeature( 'adsenseSetupV2' );

	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const accountStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountStatus()
	);
	const siteStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getSiteStatus()
	);
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseSnippet()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const siteStatusURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceAccountManageSitesURL()
	);
	const webStoriesActive = useSelect( ( select ) =>
		select( CORE_SITE ).isWebStoriesActive()
	);
	const webStoriesAdUnit = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getWebStoriesAdUnit()
	);
	const autoAdsDisabled = useSelect(
		( select ) => select( MODULES_ADSENSE ).getAutoAdsDisabled() || []
	);

	let accountStatusLabel;
	switch ( accountStatus ) {
		case ACCOUNT_STATUS_APPROVED:
			accountStatusLabel = __(
				'Your account has been approved',
				'google-site-kit'
			);
			break;
		case ACCOUNT_STATUS_READY:
			accountStatusLabel = __(
				'Your site is ready for ads',
				'google-site-kit'
			);
			break;
		case ACCOUNT_STATUS_PENDING:
		case ACCOUNT_STATUS_GRAYLISTED:
			accountStatusLabel = __(
				'We’re getting your site ready for ads. This usually takes less than a day, but it can sometimes take a bit longer',
				'google-site-kit'
			);
			break;
		case ACCOUNT_STATUS_NO_CLIENT:
		case ACCOUNT_STATUS_DISAPPROVED:
		case ACCOUNT_STATUS_NEEDS_ATTENTION:
		case ACCOUNT_STATUS_CLIENT_REQUIRES_REVIEW:
		case ACCOUNT_STATUS_CLIENT_GETTING_READY:
			accountStatusLabel = __(
				'You need to fix some issues before your account is approved. Go to AdSense to find out how to fix it',
				'google-site-kit'
			);
			break;
		default:
			accountStatusLabel = __(
				'Your site isn’t ready to show ads yet',
				'google-site-kit'
			);
	}

	let siteStatusLabel;
	switch ( siteStatus ) {
		case SITE_STATUS_NEEDS_ATTENTION:
		case SITE_STATUS_REQUIRES_REVIEW:
			siteStatusLabel = __(
				'You need to fix some things before your site is ready.',
				'google-site-kit'
			);
			break;
		case SITE_STATUS_GETTING_READY:
			siteStatusLabel = __(
				'Your site is getting ready.',
				'google-site-kit'
			);
			break;
		case SITE_STATUS_READY:
			siteStatusLabel = __(
				'Your site is ready for ads.',
				'google-site-kit'
			);
			break;
		case SITE_STATUS_READY_NO_AUTO_ADS:
			siteStatusLabel = __(
				'Your site is ready, with auto-ads disabled.',
				'google-site-kit'
			);
			break;
		default:
			siteStatusLabel = '';
	}

	const siteStatusLinkLabel = adsenseSetupV2Enabled
		? createInterpolateElement(
				__(
					'View <VisuallyHidden>site </VisuallyHidden>in AdSense',
					'google-site-kit'
				),
				{
					VisuallyHidden: <VisuallyHidden />,
				}
		  )
		: __( 'Check your site status', 'google-site-kit' );

	let useSnippetLabel;
	if ( useSnippet ) {
		useSnippetLabel = __(
			'The AdSense code has been placed on your site',
			'google-site-kit'
		);
	} else if ( existingTag && existingTag === clientID ) {
		useSnippetLabel = __(
			'The AdSense code has been placed by another plugin or theme',
			'google-site-kit'
		);
	} else {
		useSnippetLabel = __(
			'The AdSense code has not been placed on your site',
			'google-site-kit'
		);
	}

	let autoAdsDisabledMessage = __(
		'Ads are currently displayed for all visitors',
		'google-site-kit'
	);
	if (
		autoAdsDisabled.includes( AUTO_ADS_LOGGED_IN_USERS ) &&
		autoAdsDisabled.includes( AUTO_ADS_CONTENT_CREATORS )
	) {
		autoAdsDisabledMessage = __(
			'All logged-in users and users who can write posts',
			'google-site-kit'
		);
	} else if ( autoAdsDisabled.includes( AUTO_ADS_LOGGED_IN_USERS ) ) {
		autoAdsDisabledMessage =
			trackingExclusionLabels[ AUTO_ADS_LOGGED_IN_USERS ];
	} else if ( autoAdsDisabled.includes( AUTO_ADS_CONTENT_CREATORS ) ) {
		autoAdsDisabledMessage =
			trackingExclusionLabels[ AUTO_ADS_CONTENT_CREATORS ];
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
						{ adsenseSetupV2Enabled && siteStatusLabel + ' ' }
						<Link
							href={ siteStatusURL }
							className="googlesitekit-settings-module__cta-button"
							external
							disabled={ siteStatusURL === undefined }
							hideExternalIndicator={
								siteStatusURL === undefined
							}
						>
							{ siteStatusLinkLabel }
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

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Excluded from ads', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ autoAdsDisabledMessage }
					</p>
				</div>
			</div>

			{ webStoriesActive && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __(
									'Web Stories Ad Unit',
									'google-site-kit'
								) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ ! webStoriesAdUnit && (
									<span>
										{ __( 'None', 'google-site-kit' ) }
									</span>
								) }
								{ webStoriesAdUnit && (
									<DisplaySetting
										value={ webStoriesAdUnit }
									/>
								) }
							</p>
						</div>
					</div>
				</div>
			) }
		</div>
	);
}
