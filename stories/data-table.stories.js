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
import Layout from '../assets/js/components/layout/layout';
import AnalyticsDashboardWidgetTopPagesTable from '../assets/js/modules/analytics/components/dashboard/AnalyticsDashboardWidgetTopPagesTable';
import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Data Table', () => {
		global._googlesitekitLegacyData = analyticsDashboardData;

		// Load the datacache with data.
		setTimeout( () => {
			doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		return (
			<WithTestRegistry>
				<Layout
					header
					footer
					title={ __( 'Top content over the last 28 days', 'google-site-kit' ) }
					headerCtaLink="https://analytics.google.com"
					headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
					footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCtaLink="https://analytics.google.com"
				>
					<AnalyticsDashboardWidgetTopPagesTable />
				</Layout>
			</WithTestRegistry>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-table-overflow',
			delay: 2000, // Wait for table overflow to animate.
		},
	} );
