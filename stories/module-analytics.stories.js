import { storiesOf } from '@storybook/react';
import { __ } from '@wordpress/i18n';
import Layout from 'GoogleComponents/layout/layout';
import AnalyticsDashboardWidgetOverview from 'GoogleModules/analytics/dashboard/dashboard-widget-overview';
import AnalyticsDashboardWidgetSiteStats from 'GoogleModules/analytics/dashboard/dashboard-widget-sitestats';
import DashboardAcquisitionPieChart from 'GoogleModules/analytics/dashboard/dashboard-widget-acquisition-piechart';
import AnalyticsDashboardWidgetTopAcquisitionSources from 'GoogleModules/analytics/dashboard/dashboard-widget-top-acquisition-sources-table';
import { googlesitekit as analyticsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';

storiesOf( 'Analytics Module', module )
	.add( 'Audience Overview Chart', () => {
		window.googlesitekit = analyticsData;

		const selectedStats = [
			0,
		];
		const series = {
			'0': {
				'color': '#4285f4',
				'targetAxisIndex': 0
			},
			'1': {
				'color': '#4285f4',
				'targetAxisIndex': 0,
				'lineDashStyle': [
					3,
					3
				],
				'lineWidth': 1
			}
		};
		const vAxes = null;

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Single'
			);
		}, 250 );

		return (
			<Layout
				header
				title={ __( 'Audience overview for the last 28 days', 'google-site-kit' ) }
				headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
				headerCtaLink="http://analytics.google.com"
			>
				<AnalyticsDashboardWidgetOverview
					selectedStats={ selectedStats }
					handleDataError={ () => {} }
				/>
				<AnalyticsDashboardWidgetSiteStats
					selectedStats={ selectedStats }
					series={ series }
					vAxes={ vAxes }
				/>
			</Layout>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } )
	.add( 'Top Acquisition Pie Chart', () => {
		window.googlesitekit = analyticsData;

		// Load the datacache with data.
		setTimeout( () => {
			wp.hooks.doAction(
				'googlesitekit.moduleLoaded',
				'Single'
			);
		}, 250 );
		return (
			<Layout
				header
				footer
				title={ __( 'Top acquisition sources over the last 28 days', 'google-site-kit' ) }
				headerCtaLink="https://analytics.google.com"
				headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
				footerCtaLabel={ __( 'Analytics', 'google-site-kit' ) }
				footerCtaLink="https://analytics.google.com"
			>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-desktop
							mdc-layout-grid__cell--span-8-tablet
							mdc-layout-grid__cell--span-4-phone
						">
							<DashboardAcquisitionPieChart/>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-8-desktop
							mdc-layout-grid__cell--span-8-tablet
							mdc-layout-grid__cell--span-4-phone
						">
							<AnalyticsDashboardWidgetTopAcquisitionSources/>
						</div>
					</div>
				</div>
			</Layout>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } );
