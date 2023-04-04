/**
 * SwitchedToGA4Banner component.
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
import BannerNotification from './BannerNotification';
import SuccessGreenSVG from '../../../svg/graphics/ga4-success-green.svg';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import {
	DASHBOARD_VIEW_UA,
	MODULES_ANALYTICS,
} from '../../modules/analytics/datastore/constants';
const { useSelect } = Data;

export default function SwitchedToGA4Banner() {
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const dashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getDashboardView()
	);

	const shouldDisplayNotification =
		analyticsModuleConnected &&
		ga4ModuleConnected &&
		dashboardView === DASHBOARD_VIEW_UA;

	if ( ! shouldDisplayNotification ) {
		return null;
	}

	return (
		<BannerNotification
			id="switched-to-ga4-banner"
			// className="googlesitekit-ga4-setup-banner"
			title={ __(
				'Your dashboard now displays data from Google Analytics 4, the new version of Analytics',
				'google-site-kit'
			) }
			description={ __(
				'Universal Analytics, the old version of Google Analytics, stopped collecting data on July 1 2023.',
				'google-site-kit'
			) }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			ctaLabel={ __( 'Learn what’s new', 'google-site-kit' ) }
			ctaLink="#"
			onCTAClick={ () => {} }
			dismiss={ __( 'No, thanks', 'google-site-kit' ) }
		/>
	);
}
