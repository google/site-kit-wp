/**
 * FirstPartyModeSetupBanner component.
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
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '../AdminMenuTooltip';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import SetupCTA from '../../googlesitekit/notifications/components/layout/SetupCTA';
import useViewContext from '../../hooks/useViewContext';
import { DAY_IN_SECONDS } from '../../util';
import BannerSVGDesktop from '@/svg/graphics/banner-first-party-mode-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-first-party-mode-setup-cta-mobile.svg?url';

export const FPM_SHOW_SETUP_SUCCESS_NOTIFICATION =
	'fpm-show-setup-success-notification';

export default function FirstPartyModeSetupBanner( { id, Notification } ) {
	const viewContext = useViewContext();

	const { setFirstPartyModeEnabled, saveFirstPartyModeSettings } =
		useDispatch( CORE_SITE );

	const tooltipSettings = {
		tooltipSlug: id,
		content: __(
			'You can always enable First-party mode in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { invalidateResolution } = useDispatch( CORE_NOTIFICATIONS );

	const { setValue } = useDispatch( CORE_UI );

	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'first-party-mode-introduction'
		)
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const onCTAClick = async () => {
		setFirstPartyModeEnabled( true );
		const { error } = await saveFirstPartyModeSettings();

		if ( error ) {
			return;
		}

		setValue( FPM_SHOW_SETUP_SUCCESS_NOTIFICATION, true );
		invalidateResolution( 'getQueuedNotifications', [
			viewContext,
			NOTIFICATION_GROUPS.DEFAULT,
		] );

		dismissNotification( id );
	};

	const ctaError = useSelect( ( select ) => {
		const firstPartyModeSettings =
			select( CORE_SITE ).getFirstPartyModeSettings();
		return select( CORE_SITE ).getErrorForAction(
			'saveFirstPartyModeSettings',
			[ firstPartyModeSettings ]
		);
	} );

	const { triggerSurvey } = useDispatch( CORE_USER );
	const handleView = useCallback( () => {
		if ( usingProxy ) {
			triggerSurvey( 'view_fpm_setup_cta', { ttl: DAY_IN_SECONDS } );
		}
	}, [ triggerSurvey, usingProxy ] );

	return (
		<Notification onView={ handleView }>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Get more comprehensive stats by collecting metrics via your own site',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Enable First-party mode (<em>beta</em>) to send measurement through your own domain - this helps improve the quality and completeness of Analytics or Ads metrics.',
						'google-site-kit'
					),
					{
						em: <em />,
					}
				) }
				learnMoreLink={ {
					href: learnMoreURL,
				} }
				ctaButton={ {
					label: __( 'Enable First-party mode', 'google-site-kit' ),
					onClick: onCTAClick,
				} }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: showTooltip,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'bottom',
				} }
				errorText={ ctaError?.message }
			/>
		</Notification>
	);
}

FirstPartyModeSetupBanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
