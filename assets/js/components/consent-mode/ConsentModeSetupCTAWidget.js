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
import { Fragment, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';

import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import BannerGraphicsSVG from '../../../svg/graphics/consent-mode-setup.svg';
import BannerGraphicsTabletSVG from '../../../svg/graphics/consent-mode-setup-tablet.svg';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../AdminMenuTooltip';
import { DAY_IN_SECONDS, WEEK_IN_SECONDS } from '../../util';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import { BREAKPOINT_TABLET, useBreakpoint } from '../../hooks/useBreakpoint';
import NotificationWithSVG from '../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';

export default function ConsentModeSetupCTAWidget( { id, Notification } ) {
	const [ saveError, setSaveError ] = useState( null );

	const breakpoint = useBreakpoint();

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const consentModeDocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'consent-mode' )
	);

	const showTooltip = useShowTooltip( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
	const { isTooltipVisible } = useTooltipState(
		CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
	);

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);

	// See TODO note below.
	const isCTADismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed( id )
	);
	const dismissedPromptsLoaded = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getDismissedPrompts', [] )
	);
	const hideCTABanner = isCTADismissed || ! dismissedPromptsLoaded;

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const { setConsentModeEnabled, saveConsentModeSettings } =
		useDispatch( CORE_SITE );
	const { dismissPrompt, triggerSurvey } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	useEffect( () => {
		if ( ! hideCTABanner ) {
			if ( usingProxy ) {
				triggerSurvey( 'view_como_setup_cta', { ttl: DAY_IN_SECONDS } );
			}
		}
	}, [ hideCTABanner, triggerSurvey, usingProxy ] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable consent mode from Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG }
				/>
			</Fragment>
		);
	}

	// TODO Remove this hack
	// We "incorrectly" pass true to the `skipHidingFromQueue` option when dismissing this banner.
	// This is because we don't want the component removed from the DOM as we have to still render
	// the `AdminMenuTooltip` in this component. This means that we have to rely on manually
	// checking for the dismissal state here.
	if ( hideCTABanner ) {
		return null;
	}

	const handleCTAClick = async () => {
		setSaveError( null );
		setConsentModeEnabled( true );

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
		} else {
			await dismissPrompt( CONSENT_MODE_SETUP_CTA_WIDGET_SLUG );
			navigateTo( `${ settingsURL }#/admin-settings` );
		}
	};

	const breakpointSVGMap = {
		[ BREAKPOINT_TABLET ]: BannerGraphicsTabletSVG,
	};

	return (
		<Notification>
			<NotificationWithSVG
				id={ id }
				title={ __(
					'Enable Consent Mode to preserve tracking for your Ads campaigns',
					'google-site-kit'
				) }
				description={
					<Description
						className="googlesitekit-setup-cta-banner__description"
						text={ __(
							'Consent mode interacts with your Consent Management Platform (CMP) or custom implementation for obtaining visitor consent, such as a cookie consent banner.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ consentModeDocumentationURL }
							/>
						}
						errorText={ saveError?.message }
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __(
							'Enable consent mode',
							'google-site-kit'
						) }
						onCTAClick={ handleCTAClick }
						dismissLabel={
							isDismissalFinal
								? __( 'Don’t show again', 'google-site-kit' )
								: __( 'Maybe later', 'google-site-kit' )
						}
						onDismiss={ showTooltip }
						dismissOptions={ {
							skipHidingFromQueue: true,
						} }
						dismissExpires={ 2 * WEEK_IN_SECONDS }
					/>
				}
				SVG={ breakpointSVGMap[ breakpoint ] || BannerGraphicsSVG }
			/>
		</Notification>
	);
}

ConsentModeSetupCTAWidget.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
