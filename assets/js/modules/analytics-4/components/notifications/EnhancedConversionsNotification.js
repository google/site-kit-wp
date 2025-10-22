/**
 * Analytics EnhancedConversionsNotification component.
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
import { escapeURI } from '@/js/util/escape-uri';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { TYPES } from '@/js/components/Notice/constants';
import LearnMoreLink from '@/js/googlesitekit/notifications/components/common/LearnMoreLink';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';

export const ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS =
	'ecee-notification-analytics';

export default function EnhancedConversionsNotification( {
	id,
	Notification,
} ) {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'enhanced-conversions-analytics'
		)
	);
	const ctaURL = useSelect( ( select ) => {
		const { getAccountID, getPropertyID, getServiceURL } =
			select( MODULES_ANALYTICS_4 );

		const accountID = getAccountID();
		const propertyID = getPropertyID();

		return getServiceURL( {
			path: escapeURI`/a${ accountID }p${ propertyID }/admin/datapolicies/datacollection`,
		} );
	} );

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.INFO_ALT }
				title={ __(
					'Boost your Analytics data with enhanced conversions',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Site Kit now supports enhanced conversions. This free feature helps you get a more complete and reliable count of your sales and leads from your website, even when people switch devices. To activate, turn on the setting for collecting user data in your Analytics account. <a />',
						'google-site-kit'
					),
					{
						a: (
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ documentationURL }
								hideExternalIndicator
							/>
						),
					}
				) }
				dismissButton={ {
					label: __( 'No thanks', 'google-site-kit' ),
				} }
				ctaButton={ {
					label: __( 'Go to Analytics', 'google-site-kit' ),
					href: ctaURL,
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
