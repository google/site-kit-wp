/**
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import BannerSVGDesktop from '@/svg/graphics/banner-consent-mode-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-consent-mode-setup-cta-mobile.svg?url';
import { useShowTooltip } from '../AdminMenuTooltip';
import { DAY_IN_SECONDS, WEEK_IN_SECONDS } from '../../util';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import useViewContext from '../../hooks/useViewContext';
import SetupCTA from '../../googlesitekit/notifications/components/layout/SetupCTA';

export default function ConsentModeSetupCTABanner( { id, Notification } ) {
	const [ saveError, setSaveError ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );

	const viewContext = useViewContext();
	const gaTrackingEventArgs = {
		category: `${ viewContext }_CoMo-ads-setup-notification`,
	};

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const tooltipSettings = {
		tooltipSlug: CONSENT_MODE_SETUP_CTA_WIDGET_SLUG,
		content: __(
			'You can always enable consent mode in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { setConsentModeEnabled, saveConsentModeSettings } =
		useDispatch( CORE_SITE );
	const { triggerSurvey } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( usingProxy ) {
			triggerSurvey( 'view_como_setup_cta', { ttl: DAY_IN_SECONDS } );
		}
	}, [ triggerSurvey, usingProxy ] );

	const handleCTAClick = async () => {
		setSaveError( null );
		setConsentModeEnabled( true );
		setIsSaving( true );

		const promises = [ saveConsentModeSettings() ];

		if ( usingProxy ) {
			promises.push(
				triggerSurvey( 'enable_como', { ttl: DAY_IN_SECONDS } )
			);
		}

		const [ { error } ] = await Promise.all( promises );

		if ( error ) {
			setSaveError( error );
			setConsentModeEnabled( false );
			setIsSaving( false );
		}
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<SetupCTA
				notificationID={ id }
				title={ __(
					'Enable Consent Mode to preserve tracking for your Ads campaigns',
					'google-site-kit'
				) }
				description={ __(
					'Consent mode interacts with your Consent Management Platform (CMP) or custom implementation for obtaining visitor consent, such as a cookie consent banner.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Enable consent mode', 'google-site-kit' ),
					href: `${ settingsURL }#/admin-settings`,
					onClick: handleCTAClick,
					inProgress: isSaving,
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
					href: consentModeDocumentationURL,
				} }
				errorText={ saveError?.message }
				gaTrackingEventArgs={ gaTrackingEventArgs }
			/>
		</Notification>
	);
}

ConsentModeSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
