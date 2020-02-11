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
import Layout from 'GoogleComponents/layout/layout';
import SearchConsoleDashboardWidgetOverview from 'GoogleModules/search-console/dashboard/dashboard-widget-overview';
import SearchConsoleDashboardWidgetSiteStats from 'GoogleModules/search-console/dashboard/dashboard-widget-sitestats';

storiesOf( 'Search Console Module', module )
	.add( 'Overview Chart', () => {
		global.googlesitekit = analyticsData;

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
			<Layout
				header
				title={ __( 'Overview for the last 28 days', 'google-site-kit' ) }
				headerCtaLabel={ __( 'See full stats in Search Console', 'google-site-kit' ) }
				headerCtaLink="https://search.google.com/search-console"
			>
				<SearchConsoleDashboardWidgetOverview
					selectedStats={ selectedStats }
				/>
				<SearchConsoleDashboardWidgetSiteStats selectedStats={ selectedStats } series={ series } vAxes={ vAxes } />
			</Layout>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } );
