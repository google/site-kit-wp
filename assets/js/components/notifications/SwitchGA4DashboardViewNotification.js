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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import GA4SuccessGreenSVG from '../../../svg/graphics/ga4-success-green.svg';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import {
	DASHBOARD_VIEW_GA4,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import BannerNotification from './BannerNotification';
import useViewOnly from '../../hooks/useViewOnly';
const { useDispatch, useSelect } = Data;

// Avoid console.log in tests.
const log = process?.stdout
	? ( ...args ) =>
			process.stdout.write(
				args.map( JSON.stringify ).join( ' ' ) + '\n'
			)
	: global.console.log;

export default function SwitchGA4DashboardViewNotification() {
	const viewOnly = useViewOnly();

	const shouldPromptGA4DashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).shouldPromptGA4DashboardView()
	);

	const ga4DocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'using-the-site-kit-dashboard-with-ga4'
		)
	);

	const { setValue } = useDispatch( CORE_UI );
	const { setDashboardView, saveSettings } = useDispatch( MODULES_ANALYTICS );

	// Preload conversion events and search funnel overview report to help reduce Search Funnel widget loading time,
	// in order to reduce the delay in showing the GA4 Reporting feature tour.
	useSelect( ( select ) =>
		shouldPromptGA4DashboardView
			? select( MODULES_ANALYTICS_4 ).getConversionEvents()
			: null
	);

	useSelect( ( select ) =>
		shouldPromptGA4DashboardView
			? select( MODULES_ANALYTICS_4 ).getSearchFunnelOverviewReport(
					viewOnly
			  )
			: null
	);

	const handleCTAClick = () => {
		const date = new Date();
		log( 'handleCTAClick', date, date.getTime() );

		setValue( 'forceInView', true );
		setValue( 'showGA4ReportingTour', true );

		setDashboardView( DASHBOARD_VIEW_GA4 );
		saveSettings();

		return { dismissOnCTAClick: false };
	};

	if ( ! shouldPromptGA4DashboardView ) {
		return null;
	}

	return (
		<BannerNotification
			id="switch-ga4-dashboard-view"
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
			WinImageSVG={ () => <GA4SuccessGreenSVG /> }
			learnMoreLabel={ __( 'Learn what’s new', 'google-site-kit' ) }
			learnMoreURL={ ga4DocumentationURL }
		/>
	);
}
