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
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	useShowTooltip,
	useTooltipState,
	AdminMenuTooltip,
} from '../AdminMenuTooltip';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import NotificationWithSVG from '../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import FPMSetupCTASVGDesktop from '../../../svg/graphics/first-party-mode-setup-banner-desktop.svg';
import FPMSetupCTASVGTablet from '../../../svg/graphics/first-party-mode-setup-banner-tablet.svg';
import FPMSetupCTASVGMobile from '../../../svg/graphics/first-party-mode-setup-banner-mobile.svg';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../hooks/useBreakpoint';
import useViewContext from '../../hooks/useViewContext';
import { DAY_IN_SECONDS, trackEvent } from '../../util';

export const FPM_SHOW_SETUP_SUCCESS_NOTIFICATION =
	'fpm-show-setup-success-notification';

export default function FirstPartyModeSetupBanner( { id, Notification } ) {
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();

	const { setFirstPartyModeEnabled, saveFirstPartyModeSettings } =
		useDispatch( CORE_SITE );

	const showTooltip = useShowTooltip( id );

	const { isTooltipVisible } = useTooltipState( id );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const isItemDismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed( id )
	);

	const { invalidateResolution } = useDispatch( CORE_NOTIFICATIONS );

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem( id )
	);

	const { setValue } = useDispatch( CORE_UI );

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'first-party-mode-introduction'
		);
	} );

	useEffect( () => {
		if ( isTooltipVisible ) {
			trackEvent( `${ viewContext }_fpm-setup-cta`, 'tooltip_view' );
		}
	}, [ isTooltipVisible, viewContext ] );

	const onCTAClick = async () => {
		setFirstPartyModeEnabled( true );
		const { error } = await saveFirstPartyModeSettings();

		if ( error ) {
			return { error };
		}

		setValue( FPM_SHOW_SETUP_SUCCESS_NOTIFICATION, true );
		invalidateResolution( 'getQueuedNotifications', [
			viewContext,
			NOTIFICATION_GROUPS.DEFAULT,
		] );
	};

	const { triggerSurvey } = useDispatch( CORE_USER );
	const handleView = useCallback( () => {
		if ( usingProxy ) {
			triggerSurvey( 'view_fpm_setup_cta', { ttl: DAY_IN_SECONDS } );
		}
	}, [ triggerSurvey, usingProxy ] );

	const onDismiss = () => {
		showTooltip();
	};

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable First-party mode from Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					onDismiss={ () => {
						trackEvent(
							`${ viewContext }_fpm-setup-cta`,
							'tooltip_dismiss'
						);
					} }
					tooltipStateKey={ id }
				/>
			</Fragment>
		);
	}

	if ( isItemDismissed || isDismissing ) {
		return null;
	}

	const breakpointSVGMap = {
		[ BREAKPOINT_SMALL ]: FPMSetupCTASVGMobile,
		[ BREAKPOINT_TABLET ]: FPMSetupCTASVGTablet,
	};

	return (
		<Notification onView={ handleView }>
			<NotificationWithSVG
				id={ id }
				title={ __(
					'Get more comprehensive stats by collecting metrics via your own site',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'Enable First-party mode (<em>beta</em>) to send measurement through your own domain - this helps improve the quality and completeness of Analytics or Ads metrics.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ learnMoreURL }
							/>
						}
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __(
							'Enable First-party mode',
							'google-site-kit'
						) }
						onCTAClick={ onCTAClick }
						ctaDismissOptions={ {
							skipHidingFromQueue: false,
						} }
						dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
						onDismiss={ onDismiss }
						dismissOptions={ {
							skipHidingFromQueue: true,
						} }
					/>
				}
				SVG={ breakpointSVGMap[ breakpoint ] || FPMSetupCTASVGDesktop }
			/>
		</Notification>
	);
}
