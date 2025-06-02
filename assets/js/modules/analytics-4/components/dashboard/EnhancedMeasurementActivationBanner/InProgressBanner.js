/**
 * EnhancedMeasurementActivationBanner > InProgressBanner component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import SetupCTA from '../../../../../googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVG from '@/svg/graphics/banner-enhanced-measurement-setup-cta.svg?url';
import BannerMobileSVG from '@/svg/graphics/banner-enhanced-measurement-setup-cta-mobile.svg?url';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '../../../datastore/constants';

export default function InProgressBanner( { id, Notification, onDismiss } ) {
	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/9216061',
		} )
	);

	const hasEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const description = hasEditScope
		? __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required.',
				'google-site-kit'
		  )
		: __(
				'Enable enhanced measurement in Analytics to automatically track metrics like file downloads, video plays, form interactions, etc. No extra code required — you’ll be redirected to give permission for Site Kit to enable it on your behalf.',
				'google-site-kit'
		  );

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Understand how visitors interact with your content',
					'google-site-kit'
				) }
				description={ description }
				learnMoreLink={ {
					href: documentationURL,
				} }
				ctaButton={ {
					label: __( 'Enable now', 'google-site-kit' ),
					disabled: true,
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: onDismiss,
				} }
				waitingProgress={ {
					height: 7,
					indeterminate: true,
				} }
				helpText={ __(
					'You can always add/edit this in the Site Kit Settings',
					'google-site-kit'
				) }
				svg={ {
					desktop: BannerSVG,
					mobile: BannerMobileSVG,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
}

InProgressBanner.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType,
	onDismiss: PropTypes.func,
};
