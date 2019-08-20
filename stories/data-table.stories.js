/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import Layout from 'GoogleComponents/layout/layout';
import AnalyticsDashboardWidgetTopPagesTable from 'GoogleModules/analytics/dashboard/dashboard-widget-top-pages-table.js';
/**
 * Internal dependencies
 */
import { googlesitekit as analyticsDashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';

storiesOf( 'Global', module )
	.add( 'Data Table', () => {
		window.googlesitekit = analyticsDashboardData;

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Dashboard'
			);
		}, 250 );
		return (
			<Layout
				header
				footer
				title={ __( 'Top content over the last 28 days', 'google-site-kit' ) }
				headerCtaLink="https://analytics.google.com"
				headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
				footerCtaLabel={ __( 'Analytics', 'google-site-kit' ) }
				footerCtaLink="https://analytics.google.com"
			>
				<AnalyticsDashboardWidgetTopPagesTable />
			</Layout>
		);
	}, {
		options: {
			readySelector: '.googlesitekit-table-overflow',
			delay: 2000, // Wait for table overflow to animate.
		},
	} );
