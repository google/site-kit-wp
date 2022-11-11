/**
 * Analytics-4 Settings Notice component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { TYPE_INFO } from '../../../../components/SettingsNotice';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';

export default function GA4SettingsNotice( {
	ownerName,
	isGA4Connected,
	hasAnalyticsAccess,
	hasAnalytics4Access,
} ) {
	if ( ! isGA4Connected && ! hasAnalyticsAccess ) {
		return (
			<SettingsNotice
				type={ TYPE_INFO }
				Icon={ WarningIcon }
				notice={ createInterpolateElement(
					sprintf(
						/* translators: %s: module owner's name */
						__(
							'%s configured Analytics and you don’t have access to its configured property. Contact them to share access or setup Google Analytics 4.',
							'google-site-kit'
						),
						ownerName
					),
					{
						strong: <strong />,
					}
				) }
			/>
		);
	}

	if ( isGA4Connected && ! hasAnalyticsAccess ) {
		return (
			<SettingsNotice
				type={ TYPE_INFO }
				Icon={ WarningIcon }
				notice={ createInterpolateElement(
					sprintf(
						/* translators: %s: module owner's name */
						__(
							'%s configured Analytics and you don’t have access to its configured property. Contact them to share access or change the configured Google Analytics 4 property.',
							'google-site-kit'
						),
						ownerName
					),
					{
						strong: <strong />,
					}
				) }
			/>
		);
	}

	if ( isGA4Connected && hasAnalyticsAccess && ! hasAnalytics4Access ) {
		return (
			<SettingsNotice
				type={ TYPE_INFO }
				Icon={ WarningIcon }
				notice={ createInterpolateElement(
					sprintf(
						/* translators: %s: module owner's name */
						__(
							'%s configured Analytics 4 and you don’t have access to its configured property. Contact them to share access or change the configured property.',
							'google-site-kit'
						),
						ownerName
					),
					{
						strong: <strong />,
					}
				) }
			/>
		);
	}

	return null;
}

// eslint-disable-next-line sitekit/acronym-case
GA4SettingsNotice.propTypes = {
	ownerName: PropTypes.string,
	isGA4Connected: PropTypes.bool,
	hasAnalyticsAccess: PropTypes.bool,
	hasAnalytics4Access: PropTypes.bool,
};
