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
import { Fragment } from '@wordpress/element';
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

export const FPM_SHOW_SETUP_SUCCESS_NOTIFICATION =
	'fpm-show-setup-success-notification';

export default function FirstPartyModeSetupBanner( { id, Notification } ) {
	const breakpoint = useBreakpoint();
	const viewContext = useViewContext();

	const { setFirstPartyModeEnabled, saveFirstPartyModeSettings } =
		useDispatch( CORE_SITE );

	const showTooltip = useShowTooltip( id );

	const { isTooltipVisible } = useTooltipState( id );

	const isItemDismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed( id )
	);

	const { dismissNotification, invalidateResolution } =
		useDispatch( CORE_NOTIFICATIONS );
	const { setValue } = useDispatch( CORE_UI );

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'first-party-mode-introduction'
		);
	} );

	const onCTAClick = async () => {
		setFirstPartyModeEnabled( true );
		await saveFirstPartyModeSettings();

		setValue( FPM_SHOW_SETUP_SUCCESS_NOTIFICATION, true );
		invalidateResolution( 'getQueuedNotifications', [
			viewContext,
			NOTIFICATION_GROUPS.DEFAULT,
		] );

		dismissNotification( id );
	};

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
					tooltipStateKey={ id }
				/>
			</Fragment>
		);
	}

	if ( isItemDismissed ) {
		return null;
	}

	const getBannerSVG = () => {
		if ( breakpoint === BREAKPOINT_SMALL ) {
			return FPMSetupCTASVGMobile;
		}

		if ( breakpoint === BREAKPOINT_TABLET ) {
			return FPMSetupCTASVGTablet;
		}

		return FPMSetupCTASVGDesktop;
	};

	return (
		<Notification>
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
						dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
						onDismiss={ onDismiss }
						dismissOptions={ {
							skipHidingFromQueue: true,
						} }
					/>
				}
				SVG={ getBannerSVG() }
			/>
		</Notification>
	);
}
