/**
 * Ads EnhancedConversionsNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';

export const ENHANCED_CONVERSIONS_NOTIFICATION_ADS = 'ecee-notification-ads';

export default function EnhancedConversionsNotification( {
	id,
	Notification,
} ) {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversions-ads'
		)
	);

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ NOTICE_TYPES.INFO_ALT }
				title={ __(
					'Improve your measurement with enhanced conversions',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Site Kit now supports enhanced conversions, which improves the accuracy of your conversion measurement by sending first-party data from your website to Google in a privacy-safe way. Accept the terms of service in your Google Ads account to get started. If you’ve already done this, no further action is required. <a />',
						'google-site-kit'
					),
					{
						a: (
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ documentationURL }
							/>
						),
					}
				) }
				dismissButton={ {
					label: __( 'No thanks', 'google-site-kit' ),
				} }
				ctaButton={ {
					label: __( 'Go to Ads', 'google-site-kit' ),
					href: 'https://ads.google.com/aw/conversions/customersettings',
					dismissOnClick: true,
					external: true,
					hideExternalIndicator: true,
				} }
			/>
		</Notification>
	);
}

EnhancedConversionsNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
