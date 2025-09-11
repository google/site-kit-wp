/**
 * GoogleTagGatewaySetupBanner component.
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
import {
	createInterpolateElement,
	useCallback,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminMenuTooltip';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { NOTIFICATION_AREAS } from '@/js/googlesitekit/notifications/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '@/js/util';
import SetupCTA from '@/js/googlesitekit/notifications/components/layout/SetupCTA';
import BannerSVGDesktop from '@/svg/graphics/banner-google-tag-gateway-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-google-tag-gateway-setup-cta-mobile.svg?url';
import GoogleTagGatewaySetupSuccessSubtleNotification, {
	GOOGLE_TAG_GATEWAY_SETUP_SUCCESS_NOTIFICATION,
} from './GoogleTagGatewaySetupSuccessSubtleNotification';

export default function GoogleTagGatewaySetupBanner( { id, Notification } ) {
	const [ inProgress, setInProgress ] = useState( false );
	const { setGoogleTagGatewayEnabled, saveGoogleTagGatewaySettings } =
		useDispatch( CORE_SITE );

	const tooltipSettings = {
		tooltipSlug: id,
		content: __(
			'You can always enable Google tag gateway for advertisers in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { dismissNotification, registerNotification } =
		useDispatch( CORE_NOTIFICATIONS );

	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'google-tag-gateway-introduction'
		)
	);

	async function onCTAClick() {
		setInProgress( true );
		setGoogleTagGatewayEnabled( true );
		const { error } = await saveGoogleTagGatewaySettings();

		if ( error ) {
			setInProgress( false );
			return;
		}

		dismissNotification( id );

		registerNotification( GOOGLE_TAG_GATEWAY_SETUP_SUCCESS_NOTIFICATION, {
			Component: GoogleTagGatewaySetupSuccessSubtleNotification,
			areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
			isDismissible: false,
			featureFlag: 'googleTagGateway',
		} );

		setInProgress( false );
	}

	const ctaError = useSelect( ( select ) => {
		const googleTagGatewaySettings =
			select( CORE_SITE ).getGoogleTagGatewaySettings();
		return select( CORE_SITE ).getErrorForAction(
			'saveGoogleTagGatewaySettings',
			[ googleTagGatewaySettings ]
		);
	} );

	const { triggerSurvey } = useDispatch( CORE_USER );
	const handleView = useCallback( () => {
		if ( usingProxy ) {
			triggerSurvey( 'view_gtg_setup_cta', { ttl: DAY_IN_SECONDS } );
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
						'Enable Google tag gateway for advertisers (<em>beta</em>) to send measurement through your own domain - this helps improve the quality and completeness of Analytics or Ads metrics.',
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
					label: __(
						'Enable Google tag gateway for advertisers',
						'google-site-kit'
					),
					onClick: onCTAClick,
					inProgress,
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

GoogleTagGatewaySetupBanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
