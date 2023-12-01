/**
 * Adsense Settings utilities.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	trackingExclusionLabels,
	AUTO_ADS_LOGGED_IN_USERS,
	AUTO_ADS_CONTENT_CREATORS,
} from '../common/AutoAdExclusionSwitches';
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

/**
 * Returns translatable account status label.
 *
 * @since 1.93.0
 *
 * @param {string} accountStatus The active account status.
 * @return {string} The account status label.
 */
export const getAccountStatusLabel = ( accountStatus ) => {
	let accountStatusLabel = __(
		'Your site isn’t ready to show ads yet',
		'google-site-kit'
	);
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
	}
	return accountStatusLabel;
};

/**
 * Returns translatable site status label.
 *
 * @since 1.93.0
 *
 * @param {string} siteStatus The site status.
 * @return {string} The site status label.
 */
export const getSiteStatusLabel = ( siteStatus ) => {
	let siteStatusLabel = '';
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
	}
	return siteStatusLabel;
};

/**
 * Returns translatable site snippet label.
 *
 * @since 1.93.0
 *
 * @param {boolean} useSnippet  The adsense site snippet flag.
 * @param {string}  existingTag The adsense existing tag.
 * @param {string}  clientID    The client ID.
 * @return {string} The site snippet label.
 */
export const getSnippetLabel = ( useSnippet, existingTag, clientID ) => {
	let snippetLabel = __(
		'The AdSense code has not been placed on your site',
		'google-site-kit'
	);
	if ( useSnippet ) {
		snippetLabel = __(
			'The AdSense code has been placed on your site',
			'google-site-kit'
		);
	} else if ( existingTag && existingTag === clientID ) {
		snippetLabel = __(
			'The AdSense code has been placed by another plugin or theme',
			'google-site-kit'
		);
	}
	return snippetLabel;
};

/**
 * Returns translatable auto ads disabled message.
 *
 * @since 1.93.0
 *
 * @param {Array} autoAdsDisabled The array of user types strings.
 * @return {string} The auto ads disabled message.
 */
export const getAutoAdsDisabledMessage = ( autoAdsDisabled ) => {
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

	return autoAdsDisabledMessage;
};
