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
import { VIEW_CONTEXT_DASHBOARD } from '../googlesitekit/constants';
import {
	MODULES_PAGESPEED_INSIGHTS,
	PAGE_SPEED_INSIGHTS_GA_CATEGORY_FORCE_ACTIVE,
	STRATEGY_DESKTOP,
	STRATEGY_MOBILE,
} from '../modules/pagespeed-insights/datastore/constants';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

const pagespeedInsightsForceActive = {
	slug: 'pagespeedInsightsForceActive',
	contexts: [ VIEW_CONTEXT_DASHBOARD ],
	version: '1.43.0', // @TODO version
	gaEventCategory: PAGE_SPEED_INSIGHTS_GA_CATEGORY_FORCE_ACTIVE,
	checkRequirements: async ( registry ) => {
		await registry
			.__experimentalResolveSelect( MODULES_PAGESPEED_INSIGHTS )
			.getManuallyEnabled();
		const referenceURL = registry
			.select( CORE_SITE )
			.getCurrentReferenceURL();
		await registry
			.__experimentalResolveSelect( MODULES_PAGESPEED_INSIGHTS )
			.getReport( referenceURL, STRATEGY_MOBILE );
		await registry
			.__experimentalResolveSelect( MODULES_PAGESPEED_INSIGHTS )
			.getReport( referenceURL, STRATEGY_DESKTOP );

		return (
			false ===
			registry.select( MODULES_PAGESPEED_INSIGHTS ).getManuallyEnabled()
		);
	},
	steps: [
		{
			target: '.googlesitekit-widget-area--dashboardSpeed',
			title: __(
				'PageSpeed Insights is now active for everyone',
				'google-site-kit'
			),
			content: __(
				'Keep track of how your pages are doing in terms of speed and user experience and see recommendations on what to improve.',
				'google-site-kit'
			),
		},
	],
};

export default pagespeedInsightsForceActive;
