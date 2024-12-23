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
import { Fragment, useCallback, useEffect } from '@wordpress/element';
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
import {
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY,
} from '../../datastore/constants';
import SetupSVG from '../../../../../svg/graphics/reader-revenue-manager-setup.svg';
import SetupTabletSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-tablet.svg';
import SetupMobileSVG from '../../../../../svg/graphics/reader-revenue-manager-setup-mobile.svg';
import { trackEvent, WEEK_IN_SECONDS } from '../../../../util';
import {
	AdminMenuTooltip,
	useShowTooltip,
	useTooltipState,
} from '../../../../components/AdminMenuTooltip';
import useViewContext from '../../../../hooks/useViewContext';
import NotificationWithSVG from '../../../../googlesitekit/notifications/components/layout/NotificationWithSVG';
import Description from '../../../../googlesitekit/notifications/components/common/Description';
import LearnMoreLink from '../../../../googlesitekit/notifications/components/common/LearnMoreLink';
import ActionsCTALinkDismiss from '../../../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';

export default function ReaderRevenueManagerSetupCTABanner( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();
	const breakpoint = useBreakpoint();

	const onSetupActivate = useActivateModuleCallback(
		READER_REVENUE_MANAGER_MODULE_SLUG
	);

	const showTooltip = useShowTooltip(
		READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
	);
	const { isTooltipVisible } = useTooltipState(
		READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
	);

	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
		)
	);

	const { dismissPrompt, triggerSurvey } = useDispatch( CORE_USER );

	const onDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_rrm-setup-notification`,
			'dismiss_notification'
		).finally( () => {
			const expirationInSeconds =
				dismissCount < 1 ? 2 * WEEK_IN_SECONDS : 0;

			showTooltip();

			dismissPrompt( READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY, {
				expiresInSeconds: expirationInSeconds,
			} );
		} );
	}, [ dismissCount, dismissPrompt, showTooltip, viewContext ] );

	const readerRevenueManagerDocumentationURL =
		'https://readerrevenue.withgoogle.com';

	useEffect( () => {
		triggerSurvey( 'view_reader_revenue_manager_cta' );
	}, [ triggerSurvey ] );

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
					tooltipStateKey={
						READER_REVENUE_MANAGER_SETUP_BANNER_DISMISSED_KEY
					}
				/>
			</Fragment>
		);
	}

	const getBannerSVG = () => {
		if ( breakpoint === BREAKPOINT_SMALL ) {
			return SetupMobileSVG;
		}

		if ( breakpoint === BREAKPOINT_TABLET ) {
			return SetupTabletSVG;
		}

		return SetupSVG;
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
							'Turn casual visitors into loyal readers and earn more from your content with voluntary contributions, surveys, newsletter sign-ups and reader insight tools. <a>Learn more</a><br><br>* Support for subscriptions coming soon',
							'google-site-kit'
						) }
						learnMoreLink={
							<LearnMoreLink
								id={ id }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url={ readerRevenueManagerDocumentationURL }
							/>
						}
					/>
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

ReaderRevenueManagerSetupCTABanner.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
