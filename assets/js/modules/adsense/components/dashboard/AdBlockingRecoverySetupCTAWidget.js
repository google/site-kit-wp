/**
 * AdBlockingRecoverySetupCTAWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import AdsenseAdBlockingRecoverySVG from '../../../../../svg/graphics/adsense-ad-blocking-recovery.svg';
import { useShowTooltip } from '../../../../components/AdminMenuTooltip';
import Link from '../../../../components/Link';
import Banner from '../../../../components/notifications/BannerNotification/Banner';
import BannerActions from '../../../../components/notifications/BannerNotification/BannerActions';
import BannerTitle from '../../../../components/notifications/BannerNotification/BannerTitle';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import { useInView } from '../../../../hooks/useInView';
import useViewContext from '../../../../hooks/useViewContext';
import useViewOnly from '../../../../hooks/useViewOnly';
import { Cell } from '../../../../material-components';
import {
	DAY_IN_SECONDS,
	WEEK_IN_SECONDS,
	stringToDate,
	trackEvent,
} from '../../../../util';
import whenActive from '../../../../util/when-active';
import {
	AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';
import SurveyViewTrigger from '../../../../components/surveys/SurveyViewTrigger';

function AdBlockingRecoverySetupCTAWidget( { Widget, WidgetNull } ) {
	const breakpoint = useBreakpoint();
	const viewOnlyDashboard = useViewOnly();
	const inView = useInView();
	const viewContext = useViewContext();

	const tooltipSettings = {
		tooltipSlug: AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
		title: __(
			'You can always set up ad blocking recovery in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY
		)
	);
	const dismissCount = useSelect( ( select ) =>
		select( CORE_USER ).getPromptDismissCount(
			AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY
		)
	);

	const isDismissingPrompt = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingPrompt(
			AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY
		)
	);

	const adBlockingRecoverySetupStatus = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus();
	} );
	const accountStatus = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getAccountStatus();
	} );
	const setupCompletedTimestamp = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getSetupCompletedTimestamp();
	} );
	const siteStatus = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}
		return select( MODULES_ADSENSE ).getSiteStatus();
	} );
	const hasExistingAdBlockingRecoveryTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasExistingAdBlockingRecoveryTag()
	);
	const learnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/11576589',
		} )
	);
	const recoveryPageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-ad-blocking-recovery' )
	);
	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const { dismissPrompt } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const referenceDateInMilliseconds = stringToDate( referenceDate ).getTime();
	const setupCompletedTimestampInMilliseconds =
		setupCompletedTimestamp * 1000;
	const threeWeeksInMilliseconds = WEEK_IN_SECONDS * 3 * 1000;
	const isThreeWeeksAfterSetupCompleted =
		referenceDateInMilliseconds - setupCompletedTimestampInMilliseconds >=
		threeWeeksInMilliseconds;

	const shouldShowWidget =
		! viewOnlyDashboard &&
		hasExistingAdBlockingRecoveryTag === false &&
		isDismissed === false &&
		isDismissingPrompt === false &&
		adBlockingRecoverySetupStatus === '' &&
		accountStatus === ACCOUNT_STATUS_READY &&
		siteStatus === SITE_STATUS_READY &&
		( ! setupCompletedTimestamp || isThreeWeeksAfterSetupCompleted );

	useEffect( () => {
		if ( inView && shouldShowWidget ) {
			trackEvent(
				`${ viewContext }_adsense-abr-cta-widget`,
				'view_notification'
			);
		}
	}, [ inView, shouldShowWidget, viewContext ] );

	const handleCTAClick = async () => {
		await trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'confirm_notification'
		);
		return navigateTo( recoveryPageURL );
	};

	const handleDismissClick = async () => {
		trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'dismiss_notification'
		);

		showTooltip();

		// For the first two dismissals, we show the notification again in two weeks.
		if ( dismissCount < 2 ) {
			const twoWeeksInSeconds = WEEK_IN_SECONDS * 2;
			await dismissPrompt( AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY, {
				expiresInSeconds: twoWeeksInSeconds,
			} );
		} else {
			// For the third dismissal, dismiss permanently.
			await dismissPrompt( AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY );
		}
	};

	const handleLearnMoreClick = () => {
		trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'click_learn_more_link'
		);
	};

	if ( ! shouldShowWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget>
			{ inView && shouldShowWidget && (
				<SurveyViewTrigger
					triggerID="view_abr_setup_cta"
					ttl={ DAY_IN_SECONDS }
				/>
			) }
			<Banner>
				<Cell smSize={ 8 } mdSize={ 4 } lgSize={ 7 }>
					<BannerTitle
						title={ __(
							'Recover revenue lost to ad blockers',
							'google-site-kit'
						) }
					/>

					<div className="googlesitekit-widget--adBlockingRecovery__content">
						<p>
							{ createInterpolateElement(
								__(
									'Display a message to give site visitors with an ad blocker the option to allow ads on your site. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											onClick={ handleLearnMoreClick }
											href={ learnMoreURL }
											external
										/>
									),
								}
							) }
						</p>
						<p>
							{ __(
								'Publishers see up to 1 in 5 users choose to allow ads once they encounter an ad blocking recovery message*',
								'google-site-kit'
							) }
						</p>
					</div>

					<BannerActions
						ctaLink="#"
						ctaLabel={ __( 'Set up now', 'google-site-kit' ) }
						ctaCallback={ handleCTAClick }
						dismissCallback={ handleDismissClick }
						dismissLabel={
							dismissCount < 2
								? __( 'Maybe later', 'google-site-kit' )
								: __( 'Don’t show again', 'google-site-kit' )
						}
					/>
				</Cell>

				<Cell
					className="googlesitekit-widget--adBlockingRecovery__graphics"
					smSize={ 8 }
					mdSize={ 4 }
					lgSize={ 5 }
				>
					{ breakpoint !== BREAKPOINT_SMALL && (
						<AdsenseAdBlockingRecoverySVG
							style={ {
								maxHeight: '172px',
							} }
						/>
					) }

					<p>
						{ __(
							'*Average for publishers showing non-dismissible ad blocking recovery messages placed at the center of the page on desktop',
							'google-site-kit'
						) }
					</p>
				</Cell>
			</Banner>
		</Widget>
	);
}

AdBlockingRecoverySetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: 'adsense' } )(
	AdBlockingRecoverySetupCTAWidget
);
