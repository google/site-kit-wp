/**
 * Data Table Page Stories.
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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../assets/js/components/layout/Layout';
import LegacyAnalyticsDashboardWidgetTopPagesTable from '../assets/js/modules/analytics/components/dashboard/LegacyAnalyticsDashboardWidgetTopPagesTable';
import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Data Table', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				accountID: '123456789',
				propertyID: 'UA-1234567-1',
				internalWebPropertyID: '123456789',
				profileID: '123456789',
			} );
		};

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<Layout
					header
					footer
					title={ __( 'Top content over the last 28 days', 'google-site-kit' ) }
					headerCTALink="https://analytics.google.com"
					headerCTALabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
					footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCTALink="https://analytics.google.com"
				>
					<LegacyAnalyticsDashboardWidgetTopPagesTable />
				</Layout>
			</WithTestRegistry>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-table-overflow',
			delay: 2000, // Wait for table overflow to animate.
		},
	} );
