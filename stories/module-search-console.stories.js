/**
 * Search Console Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { googlesitekit as analyticsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import Layout from '../assets/js/components/layout/Layout';
import LegacySearchConsoleDashboardWidgetOverview from '../assets/js/modules/search-console/components/dashboard/LegacySearchConsoleDashboardWidgetOverview';
import LegacySearchConsoleDashboardWidgetSiteStats from '../assets/js/modules/search-console/components/dashboard/LegacySearchConsoleDashboardWidgetSiteStats';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Search Console Module', module )
	.add( 'Overview Chart', () => {
		global._googlesitekitLegacyData = analyticsData;

		const selectedStats = [
			0,
			1,
		];
		const series = [
			{
				color: '#4285f4',
				targetAxisIndex: 0,
			},
			{
				color: '#27bcd4',
				targetAxisIndex: 1,
			},
		];
		const vAxes = [
			{
				title: 'Clicks',
			},
			{
				title: 'Impressions',
			},
		];

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Single'
			);
		}, 250 );

		return (
			<WithTestRegistry>
				<Layout
					header
					title={ __( 'Overview for the last 28 days', 'google-site-kit' ) }
					headerCTALabel={ __( 'See full stats in Search Console', 'google-site-kit' ) }
					headerCTALink="https://search.google.com/search-console"
				>
					<LegacySearchConsoleDashboardWidgetOverview
						selectedStats={ selectedStats }
						handleDataError={ () => {} } // Required prop.
					/>
					<LegacySearchConsoleDashboardWidgetSiteStats selectedStats={ selectedStats } series={ series } vAxes={ vAxes } />
				</Layout>
			</WithTestRegistry>
		);
	},
	{
		options: { readySelector: '.googlesitekit-chart .googlesitekit-chart__inner' },
	} );
