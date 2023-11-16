/**
 * All Traffic Widget Feature Tour.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import { CORE_UI } from '../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { UI_ALL_TRAFFIC_LOADED } from '../modules/analytics/datastore/constants';

const allTrafficWidget = {
	slug: 'allTrafficWidget',
	contexts: [
		VIEW_CONTEXT_MAIN_DASHBOARD,
		VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	],
	version: '1.25.0',
	gaEventCategory: ( viewContext ) => `${ viewContext }_all-traffic-widget`,
	checkRequirements: async ( registry ) => {
		const connected = await registry
			.resolveSelect( CORE_MODULES )
			.isModuleConnected( 'analytics' );

		if ( ! connected ) {
			return false;
		}

		// Wait for All Traffic widget to finish loading.
		await new Promise( ( resolve ) => {
			const resolveWhenLoaded = () => {
				if (
					registry.select( CORE_UI ).getValue( UI_ALL_TRAFFIC_LOADED )
				) {
					resolve();
				} else {
					setTimeout( resolveWhenLoaded, 250 );
				}
			};

			setTimeout( resolveWhenLoaded, 250 );
		} );

		return true;
	},
	steps: [
		{
			target: '.googlesitekit-widget--analyticsAllTraffic__totals',
			title: __(
				'It’s now easier to see your site’s traffic at a glance',
				'google-site-kit'
			),
			content: __(
				'Check the trend graph to see how your traffic changed over time',
				'google-site-kit'
			),
			placement: 'top',
		},
		{
			target: '.googlesitekit-widget--analyticsAllTraffic__dimensions',
			title: __( 'See where your visitors come from', 'google-site-kit' ),
			content: __(
				'Click on the chart slices to see how each segment has changed over time',
				'google-site-kit'
			),
			placement: 'top',
		},
		{
			target: '.googlesitekit-header__date-range-selector-menu',
			title: __(
				'Check how your traffic changed since you last looked',
				'google-site-kit'
			),
			content: __(
				'Select a time frame to see the comparison with the previous time period',
				'google-site-kit'
			),
		},
	],
};

export default allTrafficWidget;
