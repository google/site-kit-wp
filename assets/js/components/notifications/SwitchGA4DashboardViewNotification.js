/**
 * SwitchGA4DashboardViewNotification component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import GA4SuccessGreenSVG from '../../../svg/graphics/ga4-success-green.svg';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import {
	DASHBOARD_VIEW_GA4,
	GA4_DASHBOARD_VIEW_NOTIFICATION_ID,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import BannerNotification from './BannerNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
const { useDispatch, useSelect } = Data;

export default function SwitchGA4DashboardViewNotification() {
	const viewContext = useViewContext();

	const shouldPromptGA4DashboardView = useSelect( ( select ) => {
		const isNotificationDismissed = select( CORE_USER ).isItemDismissed(
			GA4_DASHBOARD_VIEW_NOTIFICATION_ID
		);

		if ( isNotificationDismissed ) {
			return false;
		}

		return select( MODULES_ANALYTICS ).shouldPromptGA4DashboardView();
	} );

	const ga4DocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'using-the-site-kit-dashboard-with-ga4'
		)
	);

	const { setValue } = useDispatch( CORE_UI );
	const { dismissItem } = useDispatch( CORE_USER );
	const { setDashboardView, saveSettings } = useDispatch( MODULES_ANALYTICS );

	const eventCategory = `${ viewContext }_ga4-display-notification`;

	const handleOnView = useCallback( () => {
		trackEvent( eventCategory, 'view_notification' );
	}, [ eventCategory ] );

	const handleCTAClick = useCallback( () => {
		trackEvent( eventCategory, 'confirm_notification' );

		setValue( 'forceInView', true );
		setValue( 'showGA4ReportingTour', true );

		setDashboardView( DASHBOARD_VIEW_GA4 );
		saveSettings();
		dismissItem( GA4_DASHBOARD_VIEW_NOTIFICATION_ID );

		return { dismissOnCTAClick: false };
	}, [
		dismissItem,
		eventCategory,
		saveSettings,
		setDashboardView,
		setValue,
	] );

	const handleDismiss = useCallback( () => {
		trackEvent( eventCategory, 'dismiss_notification' );

		dismissItem( GA4_DASHBOARD_VIEW_NOTIFICATION_ID );
	}, [ dismissItem, eventCategory ] );

	const handleLearnMoreClick = useCallback( () => {
		trackEvent( eventCategory, 'click_learn_more_link' );
	}, [ eventCategory ] );

	if ( ! shouldPromptGA4DashboardView ) {
		return null;
	}

	return (
		<BannerNotification
			id={ GA4_DASHBOARD_VIEW_NOTIFICATION_ID }
			title={ __(
				'Display data from Google Analytics 4 on your dashboard',
				'google-site-kit'
			) }
			description={ __(
				'Update your dashboard to show data from the new version of Analytics (Google Analytics 4) instead of the old version (Universal Analytics).',
				'google-site-kit'
			) }
			ctaLink="#"
			ctaLabel={ __( 'Update dashboard', 'google-site-kit' ) }
			onCTAClick={ handleCTAClick }
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			onDismiss={ handleDismiss }
			WinImageSVG={ () => <GA4SuccessGreenSVG /> }
			learnMoreLabel={ __( 'Learn what’s new', 'google-site-kit' ) }
			learnMoreURL={ ga4DocumentationURL }
			onView={ handleOnView }
			onLearnMoreClick={ handleLearnMoreClick }
		/>
	);
}
