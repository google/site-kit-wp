/**
 * AdsModuleSetupCTAWidget component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '../../util';
import AdsSetupSVG from '../../../svg/graphics/ads-setup.svg';
import AdsSetupTabletSVG from '../../../svg/graphics/ads-setup-tablet.svg';
import AdsSetupMobileSVG from '../../../svg/graphics/ads-setup-mobile.svg';
import NotificationWithSVG from '../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import Description from '../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import useActivateModuleCallback from '../../hooks/useActivateModuleCallback';
import AdBlockerWarning from './AdBlockerWarning';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../AdminMenuTooltip';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../hooks/useBreakpoint';

const breakpointSVGMap = {
	[ BREAKPOINT_SMALL ]: AdsSetupMobileSVG,
	[ BREAKPOINT_TABLET ]: AdsSetupTabletSVG,
};

export default function AdsModuleSetupCTAWidget( { id, Notification } ) {
	const breakpoint = useBreakpoint();

	const learnMoreURL = undefined;

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const isDismissalFinal = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissalFinal( id )
	);
	const isCTADismissed = useSelect( ( select ) =>
		select( CORE_NOTIFICATIONS ).isNotificationDismissed( id )
	);
	const dismissedPromptsLoaded = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getDismissedPrompts', [] )
	);
	const hideCTABanner = isCTADismissed || ! dismissedPromptsLoaded;

	const onSetupCallback = useActivateModuleCallback( 'ads' );

	const showTooltip = useShowTooltip( id );
	const { isTooltipVisible } = useTooltipState( id );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable Ads from Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					tooltipStateKey={ id }
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

	return (
		<Notification>
			<NotificationWithSVG
				id={ id }
				title={ __(
					'Get better quality leads and enhance conversions with Ads',
					'google-site-kit'
				) }
				description={
					<Description
						text={ __(
							'Help drive sales, leads, or site traffic by getting your business in front of people who are actively searching Google for products or services you offer.',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ learnMoreURL }
							/>
						}
						AdditionalComponent={
							isAdBlockerActive && (
								<AdBlockerWarning moduleSlug="ads" />
							)
						}
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __( 'Set up Ads', 'google-site-kit' ) }
						onCTAClick={ onSetupCallback }
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
				SVG={ breakpointSVGMap[ breakpoint ] || AdsSetupSVG }
			/>
		</Notification>
	);
}

AdsModuleSetupCTAWidget.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
