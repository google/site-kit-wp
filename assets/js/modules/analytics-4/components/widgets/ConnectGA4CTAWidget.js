/**
 * ConnectGA4CTA component.
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
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '@/js/googlesitekit/widgets/default-areas';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { WEEK_IN_SECONDS } from '@/js/util';
import {
	KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ANALYTICS_4,
} from '@/js/modules/analytics-4/constants';
import useActivateModuleCallback from '@/js/hooks/useActivateModuleCallback';
import useCompleteModuleActivationCallback from '@/js/hooks/useCompleteModuleActivationCallback';
import { useDebounce } from '@/js/hooks/useDebounce';
import Link from '@/js/components/Link';
import Banner from '@/js/components/Banner';
import BannerSVGDesktop from '@/svg/graphics/banner-conversions-setup-cta.svg?url';
import BannerSVGMobile from '@/svg/graphics/banner-conversions-setup-cta-mobile.svg?url';

export default function ConnectGA4CTAWidget( { Widget, WidgetNull } ) {
	const trackingRef = useRef();
	const ga4DependantKeyMetrics = useSelect( ( select ) => {
		const keyMetrics = select( CORE_USER ).getKeyMetrics();
		const widgets = select( CORE_WIDGETS ).getWidgets(
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
		);

		if ( ! keyMetrics || ! widgets ) {
			return [];
		}

		return widgets.filter(
			( { slug, modules } ) =>
				keyMetrics.includes( slug ) &&
				modules.includes( MODULE_SLUG_ANALYTICS_4 )
		);
	} );
	const isAnalyticsActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( MODULE_SLUG_ANALYTICS_4 )
	);
	const isNavigatingToReauthURL = useSelect( ( select ) => {
		const adminReauthURL =
			select( MODULES_ANALYTICS_4 ).getAdminReauthURL();

		if ( ! adminReauthURL ) {
			return false;
		}

		return select( CORE_LOCATION ).isNavigatingTo( adminReauthURL );
	} );
	const isActivatingAnalytics = useSelect( ( select ) =>
		select( CORE_MODULES ).isFetchingSetModuleActivation(
			MODULE_SLUG_ANALYTICS_4,
			true
		)
	);
	const connectGA4URL = useSelect( ( select ) =>
		select( CORE_SITE ).getModuleSettingsEditURL( MODULE_SLUG_ANALYTICS_4 )
	);
	const isNavigatingToGA4URL = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( connectGA4URL )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const activateAnalytics = useActivateModuleCallback(
		MODULE_SLUG_ANALYTICS_4
	);
	const completeAnalyticsActivation = useCompleteModuleActivationCallback(
		MODULE_SLUG_ANALYTICS_4
	);

	const handleCTAClick = useCallback( () => {
		if ( isAnalyticsActive ) {
			return completeAnalyticsActivation();
		}

		activateAnalytics();
		return null;
	}, [ activateAnalytics, completeAnalyticsActivation, isAnalyticsActive ] );

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

		triggerSurvey( 'view_kmw_setup_cta', { ttl: WEEK_IN_SECONDS } );

		setHasBeenInView( true );
	}, [ inView, hasBeenInView, triggerSurvey ] );

	const [ inProgress, setInProgress ] = useState( false );

	/*
	 * Using debounce here because the spinner has to render across two separate calls.
	 * Rather than risk it flickering on and off in between the activation call completing and
	 * the navigate call starting, we will just set a debounce to keep the spinner for 3 seconds.
	 */
	const debouncedSetInProgress = useDebounce( setInProgress, 3000 );

	useEffect( () => {
		if (
			isActivatingAnalytics ||
			isNavigatingToReauthURL ||
			isNavigatingToGA4URL
		) {
			setInProgress( true );
		} else {
			debouncedSetInProgress( false );
		}
	}, [
		isActivatingAnalytics,
		isNavigatingToReauthURL,
		debouncedSetInProgress,
		isNavigatingToGA4URL,
	] );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);

	if ( isDismissed !== false || ga4DependantKeyMetrics.length < 4 ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<Banner
				ref={ trackingRef }
				className="googlesitekit-banner--setup-cta googlesitekit-km-connect-ga4-cta"
				title={ __( 'Analytics is disconnected', 'google-site-kit' ) }
				description={ __(
					'Metrics cannot be displayed without Analytics',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Connect Analytics', 'google-site-kit' ),
					onClick: handleCTAClick,
					disabled: inProgress,
					inProgress,
				} }
				svg={ {
					desktop: BannerSVGDesktop,
					mobile: BannerSVGMobile,
					verticalPosition: 'top',
				} }
				footer={
					<Link
						onClick={ () =>
							dismissItem(
								KM_CONNECT_GA4_CTA_WIDGET_DISMISSED_ITEM_KEY
							)
						}
					>
						{ __( 'Maybe later', 'google-site-kit' ) }
					</Link>
				}
			/>
		</Widget>
	);
}
