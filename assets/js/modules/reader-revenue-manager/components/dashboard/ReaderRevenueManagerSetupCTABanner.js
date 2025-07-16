/**
 * Reader Revenue Manager Setup CTA Banner component.
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
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../constants';
import { useShowTooltip } from '../../../../components/AdminMenuTooltip';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { WEEK_IN_SECONDS } from '../../../../util';
import SetupCTA from '../../../../googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVGDesktop from '@/svg/graphics/banner-rrm-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-rrm-setup-cta-mobile.svg?url';

export default function ReaderRevenueManagerSetupCTABanner( {
	id,
	Notification,
} ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const onSetupActivate = useActivateModuleCallback(
		MODULE_SLUG_READER_REVENUE_MANAGER
	);

	const onSetupCallback = useCallback( () => {
		setIsSaving( true );
		onSetupActivate();
	}, [ onSetupActivate, setIsSaving ] );

	const tooltipSettings = {
		tooltipSlug: 'rrm-setup-notification',
		content: __(
			'You can always enable Reader Revenue Manager in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const { triggerSurvey } = useDispatch( CORE_USER );

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	useEffect( () => {
		triggerSurvey( 'view_reader_revenue_manager_cta' );
	}, [ triggerSurvey ] );

	return (
		<Notification>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Grow your revenue and deepen reader engagement',
					'google-site-kit'
				) }
				description={ __(
					'Turn casual visitors into loyal readers and earn more from your content with paywalls, contributions, surveys, newsletter sign-ups and reader insight tools.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __(
						'Set up Reader Revenue Manager',
						'google-site-kit'
					),
					onClick: onSetupCallback,
					inProgress: isSaving,
					dismiss: true,
				} }
				dismissButton={ {
					label: isDismissalFinal
						? __( 'Don’t show again', 'google-site-kit' )
						: __( 'Maybe later', 'google-site-kit' ),
					onClick: showTooltip,
				} }
				dismissOptions={ {
					expiresInSeconds: isDismissalFinal
						? 0
						: 2 * WEEK_IN_SECONDS,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'center',
				} }
				learnMoreLink={ {
					href: 'https://readerrevenue.withgoogle.com',
				} }
			/>
		</Notification>
	);
}

ReaderRevenueManagerSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
