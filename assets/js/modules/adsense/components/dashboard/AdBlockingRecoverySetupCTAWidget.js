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
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { useShowTooltip } from '@/js/components/AdminMenuTooltip';
import Link from '@/js/components/Link';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { useInView } from '@/js/hooks/useInView';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import {
	DAY_IN_SECONDS,
	WEEK_IN_SECONDS,
	stringToDate,
	trackEvent,
} from '@/js/util';
import whenActive from '@/js/util/when-active';
import {
	AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
	MODULES_ADSENSE,
} from '@/js/modules/adsense/datastore/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import {
	ACCOUNT_STATUS_READY,
	SITE_STATUS_READY,
} from '@/js/modules/adsense/util';
import SurveyViewTrigger from '@/js/components/surveys/SurveyViewTrigger';
import Banner from '@/js/components/Banner';
import P from '@/js/components/Typography/P';
import BannerSVGDesktop from '@/svg/graphics/banner-ad-blocking-recovery-setup-cta-mobile.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-ad-blocking-recovery-setup-cta.svg?url';

function AdBlockingRecoverySetupCTAWidget( { Widget, WidgetNull } ) {
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

	const isNavigatingToRecoveryPageURL = useSelect(
		( select ) =>
			recoveryPageURL &&
			select( CORE_LOCATION ).isNavigatingTo( recoveryPageURL )
	);

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

	async function handleCTAClick() {
		await trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'confirm_notification'
		);
		navigateTo( recoveryPageURL );

		return new Promise( () => {
			// We are intentionally letting this promise unresolved.
		} );
	}

	async function handleDismissClick() {
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
	}

	function handleLearnMoreClick() {
		trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'click_learn_more_link'
		);
	}

	if ( ! shouldShowWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			{ inView && shouldShowWidget && (
				<SurveyViewTrigger
					triggerID="view_abr_setup_cta"
					ttl={ DAY_IN_SECONDS }
				/>
			) }
			<Banner
				className="googlesitekit-banner--setup-cta"
				title={ __(
					'Recover revenue lost to ad blockers',
					'google-site-kit'
				) }
				description={
					<Fragment>
						<P>
							{ __(
								'Display a message to give site visitors with an ad blocker the option to allow ads on your site.',
								'google-site-kit'
							) }{ ' ' }
							<Link
								onClick={ handleLearnMoreClick }
								href={ learnMoreURL }
								external
							>
								{ __( 'Learn more', 'google-site-kit' ) }
							</Link>
						</P>
						<P>
							{ __(
								'Publishers see up to 1 in 5 users choose to allow ads once they encounter an ad blocking recovery message*',
								'google-site-kit'
							) }
						</P>
					</Fragment>
				}
				dismissButton={ {
					label:
						dismissCount < 2
							? __( 'Maybe later', 'google-site-kit' )
							: __( 'Don’t show again', 'google-site-kit' ),
					onClick: handleDismissClick,
				} }
				ctaButton={ {
					label: __( 'Set up now', 'google-site-kit' ),
					onClick: handleCTAClick,
					disabled: isNavigatingToRecoveryPageURL,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'bottom',
				} }
				helpText={ __(
					'*Average for publishers showing non-dismissible ad blocking recovery messages placed at the center of the page on desktop',
					'google-site-kit'
				) }
			/>
		</Widget>
	);
}

AdBlockingRecoverySetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenActive( { moduleName: MODULE_SLUG_ADSENSE } )(
	AdBlockingRecoverySetupCTAWidget
);
