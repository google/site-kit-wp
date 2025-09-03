/**
 * ProductIDSubscriptionsNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';
import Notice from '@/js/components/Notice';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';

export default function ProductIDSubscriptionsNotification( {
	id,
	Notification,
} ) {
	const rrmSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getModuleSettingsEditURL(
			MODULE_SLUG_READER_REVENUE_MANAGER
		)
	);

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ Notice.TYPES.WARNING }
				description={ __(
					'To complete your Reader Revenue Manager paywall setup, add your product IDs in settings',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Edit settings', 'google-site-kit' ),
					href: rrmSettingsURL,
				} }
				dismissButton
			/>
		</Notification>
	);
}

ProductIDSubscriptionsNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
