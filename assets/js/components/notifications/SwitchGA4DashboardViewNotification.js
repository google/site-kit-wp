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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import BannerNotification from './BannerNotification';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import GA4SuccessGreenSVG from '../../../svg/graphics/ga4-success-green.svg';

const { useDispatch, useSelect } = Data;

export default function SwitchGA4DashboardViewNotification() {
	const shouldPromptGA4DashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).shouldPromptGA4DashboardView()
	);

	const isSaving = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isDoingSubmitChanges()
	);

	const ga4DocumentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	const { setDashboardView, saveSettings } = useDispatch( MODULES_ANALYTICS );

	const handleCTAClick = useCallback( async () => {
		await setDashboardView( 'google-analytics-4' );
		await saveSettings();
	}, [ saveSettings, setDashboardView ] );

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
			ctaComponent={
				<SpinnerButton
					className="googlesitekit-notification__cta"
					onClick={ handleCTAClick }
					isSaving={ isSaving }
					disabled={ isSaving }
				>
					{ __( 'Update dashboard', 'google-site-kit' ) }
				</SpinnerButton>
			}
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			WinImageSVG={ GA4SuccessGreenSVG }
			learnMoreLabel={ __( 'Learn what’s new', 'google-site-kit' ) }
			learnMoreURL={ ga4DocumentationURL }
		/>
	);
}
