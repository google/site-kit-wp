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
import {
	createInterpolateElement,
	Fragment,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import useActivateModuleCallback from '../../../../hooks/useActivateModuleCallback';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { READER_REVENUE_MANAGER_MODULE_SLUG } from '../../datastore/constants';
import SetupSVG from '../../../../../svg/graphics/reader-revenue-manager-setup.svg';
import SetupTabletSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-tablet.svg';
import SetupMobileSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-mobile.svg';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../components/AdminMenuTooltip';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import NotificationWithSVG from '../../../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import LearnMoreLink from '../../../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import { WEEK_IN_SECONDS } from '../../../../util';

export default function ReaderRevenueManagerSetupCTABanner( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();

	const onSetupActivate = useActivateModuleCallback(
		READER_REVENUE_MANAGER_MODULE_SLUG
	);

	const showTooltip = useShowTooltip( id );
	const { isTooltipVisible } = useTooltipState( id );

	const { triggerSurvey } = useDispatch( CORE_USER );

	const readerRevenueManagerDocumentationURL =
		'https://readerrevenue.withgoogle.com';

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

	useEffect( () => {
		if ( ! hideCTABanner ) {
			triggerSurvey( 'view_reader_revenue_manager_cta' );
		}
	}, [ hideCTABanner, triggerSurvey ] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<AdminMenuTooltip
					title=""
					content={ __(
						'You can always enable Reader Revenue Manager from Settings later',
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

	const breakpointSVGMap = {
		[ BREAKPOINT_SMALL ]: SetupMobileSVG,
		[ BREAKPOINT_TABLET ]: SetupTabletSVG,
	};

	return (
		<Notification>
			<NotificationWithSVG
				id={ id }
				title={ __(
					'Grow your revenue and deepen reader engagement',
					'google-site-kit'
				) }
				description={
					<div className="googlesitekit-setup-cta-banner__description">
						<p>
							{ ' ' }
							{ createInterpolateElement(
								__(
									'Turn casual visitors into loyal readers and earn more from your content with voluntary contributions, surveys, newsletter sign-ups and reader insight tools. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<LearnMoreLink
											id={ id }
											label={ __(
												'Learn more',
												'google-site-kit'
											) }
											url={
												readerRevenueManagerDocumentationURL
											}
										/>
									),
								}
							) }
							<br />
							<br />
							{ __(
								'* Support for subscriptions coming soon',
								'google-site-kit'
							) }
						</p>
					</div>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						className="googlesitekit-setup-cta-banner__actions-wrapper"
						ctaLabel={ __(
							'Set up Reader Revenue Manager',
							'google-site-kit'
						) }
						onCTAClick={ onSetupActivate }
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
				SVG={ breakpointSVGMap[ breakpoint ] || SetupSVG }
			/>
		</Notification>
	);
}

ReaderRevenueManagerSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
