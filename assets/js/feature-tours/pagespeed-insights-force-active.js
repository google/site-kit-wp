/**
 * Page Speed Insight Force Active tour for the dashboard.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/*
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_PAGE_DASHBOARD,
} from '../googlesitekit/constants';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from '../modules/pagespeed-insights/datastore/constants';

const pagespeedInsightsForceActive = {
	slug: 'pagespeedInsightsForceActive',
	contexts: [ VIEW_CONTEXT_DASHBOARD, VIEW_CONTEXT_PAGE_DASHBOARD ],
	version: '1.46.0',
	gaEventCategory: ( viewContext ) =>
		`${ viewContext }_pagespeed-widget-force-active`,
	checkRequirements: ( {
		select,
		__experimentalResolveSelect: resolveSelect,
	} ) => {
		if ( ! global._googlesitekitBaseData.showPSIForceActiveTour ) {
			return false;
		}

		const referenceURL = select( CORE_SITE ).getCurrentReferenceURL();
		const { getReport: asyncGetReport } = resolveSelect(
			MODULES_PAGESPEED_INSIGHTS
		);

		// Only show the tour if reports are available within .5 sec.
		return Promise.race( [
			// If both reports finish first, the tour will be shown.
			Promise.all( [
				asyncGetReport( referenceURL, STRATEGY_DESKTOP ),
				asyncGetReport( referenceURL, STRATEGY_MOBILE ),
			] ).then( () => true ),
			// If the timeout resolves first, the tour will not be shown.
			new Promise( ( resolve ) => setTimeout( resolve, 500 ) ).then(
				() => false
			),
		] );
	},
	steps: [
		{
			target: '.googlesitekit-widget-area--dashboardSpeed',
			title: __(
				'PageSpeed Insights is now active for everyone',
				'google-site-kit'
			),
			content: __(
				'Keep track of how your pages are doing in terms of speed and user experience. See recommendations on what to improve.',
				'google-site-kit'
			),
		},
	],
};

export default pagespeedInsightsForceActive;
