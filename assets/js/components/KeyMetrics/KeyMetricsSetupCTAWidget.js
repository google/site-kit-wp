/**
 * KeyMetricsSetupCTAWidget component.
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
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from './constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import whenActive from '@/js/util/when-active';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import { trackEvent, WEEK_IN_SECONDS } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';
import useDisplayCTAWidget from './hooks/useDisplayCTAWidget';
import Banner from '@/js/components/Banner';
import Link from '@/js/components/Link';
import BannerSVGDesktop from '@/svg/graphics/banner-conversions-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-conversions-setup-cta-mobile.svg?url';

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const trackingRef = useRef();
	const viewContext = useViewContext();
	const trackEventCategory = `${ viewContext }_kmw-cta-notification`;
	const displayCTAWidget = useDisplayCTAWidget();
	const ctaLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);
	const fullScreenSelectionLink = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-metric-selection' )
	);
	const isNavigatingToCTALink = useSelect(
		( select ) =>
			ctaLink && select( CORE_LOCATION ).isNavigatingTo( ctaLink )
	);

	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	const { triggerSurvey } = useDispatch( CORE_USER );

	useEffect( () => {
		if ( ! inView || hasBeenInView ) {
			return;
		}

		trackEvent(
			`${ viewContext }_kmw-cta-notification`,
			'view_notification'
		);

		triggerSurvey( 'view_kmw_setup_cta', { ttl: WEEK_IN_SECONDS } );

		setHasBeenInView( true );
	}, [ inView, hasBeenInView, viewContext, triggerSurvey ] );

	const tooltipSettings = {
		tooltipSlug: KEY_METRICS_SETUP_CTA_WIDGET_SLUG,
		title: __(
			'You can always set up goals in Settings later',
			'google-site-kit'
		),
		content: __(
			'The Key Metrics section will be added back to your dashboard once you set your goals in Settings',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );
	const { dismissItem } = useDispatch( CORE_USER );

	const handleDismiss = useCallback( async () => {
		await trackEvent( trackEventCategory, 'dismiss_notification' );
		showTooltip();
		await dismissItem( KEY_METRICS_SETUP_CTA_WIDGET_SLUG );
	}, [ trackEventCategory, showTooltip, dismissItem ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const openMetricsSelectionPanel = useCallback( async () => {
		await trackEvent( trackEventCategory, 'confirm_pick_own_metrics' );

		navigateTo( fullScreenSelectionLink );
	}, [ trackEventCategory, navigateTo, fullScreenSelectionLink ] );

	const onGetTailoredMetricsClick = useCallback( async () => {
		await trackEvent( trackEventCategory, 'confirm_get_tailored_metrics' );

		navigateTo( ctaLink );
	}, [ trackEventCategory, navigateTo, ctaLink ] );

	if ( ! displayCTAWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<Banner
				ref={ trackingRef }
				className="googlesitekit-banner--setup-cta"
				title={ __(
					'Get personalized suggestions for user interaction metrics based on your goals',
					'google-site-kit'
				) }
				description={ __(
					'Answer 3 questions and we’ll suggest relevant metrics for your dashboard. These metrics will help you track how users interact with your site.',
					'google-site-kit'
				) }
				dismissButton={ {
					label: __( 'Maybe later', 'google-site-kit' ),
					onClick: handleDismiss,
				} }
				ctaButton={ {
					label: __( 'Get tailored metrics', 'google-site-kit' ),
					onClick: onGetTailoredMetricsClick,
					disabled: isNavigatingToCTALink,
					inProgress: isNavigatingToCTALink,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'top',
				} }
				footer={
					<div className="googlesitekit-widget-key-metrics-footer">
						<span>
							{ __(
								'Interested in specific metrics?',
								'google-site-kit'
							) }
						</span>
						<Link onClick={ openMetricsSelectionPanel }>
							{ __(
								'Select your own metrics',
								'google-site-kit'
							) }
						</Link>
					</div>
				}
			/>
		</Widget>
	);
}

KeyMetricsSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default whenActive( { moduleName: MODULE_SLUG_ANALYTICS_4 } )(
	KeyMetricsSetupCTAWidget
);
