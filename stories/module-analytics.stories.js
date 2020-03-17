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
import Layout from 'GoogleComponents/layout/layout';
import AnalyticsDashboardWidgetOverview from 'GoogleModules/analytics/dashboard/dashboard-widget-overview';
import AnalyticsDashboardWidgetSiteStats from 'GoogleModules/analytics/dashboard/dashboard-widget-sitestats';
import DashboardAcquisitionPieChart from 'GoogleModules/analytics/dashboard/dashboard-widget-acquisition-piechart';
import AnalyticsDashboardWidgetTopAcquisitionSources from 'GoogleModules/analytics/dashboard/dashboard-widget-top-acquisition-sources-table';
import { googlesitekit as analyticsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import { AccountSelect, PropertySelect, ProfileSelect } from '../assets/js/modules/analytics/common';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">
					{ children }
				</div>
			</section>
		</div>
	);
}

const defaultSelectors = {
	getAccountID: () => '1234567',
	getPropertyID: () => 'UA-1234567-1',
	getProfileID: () => '987654321',
	hasExistingTag: () => false,
	getAccounts: () => [
		{ id: '1234567', name: 'Test Account' },
	],
	getProperties: () => [
		{ id: 'UA-1234567-1', name: 'Test Property' },
	],
	getProfiles: () => [
		{ id: '987654321', name: 'Test Profile' },
	],
};

function makeMockSelect( selectors = defaultSelectors ) {
	// Return the given selectors, regardless of the store requested.
	return () => {
		return {
			...selectors,
		};
	};
}
const mockDispatch = new Proxy( {}, {
	// Return a dummy function for every action.
	get: ( target, action ) => {
		return ( ...dispatchArgs ) => {
			// eslint-disable-next-line no-console
			console.log( 'mockDispatch', action, { dispatchArgs } );
		};
	},
} );
function makeDataProps( selectors = defaultSelectors ) {
	const mockSelect = makeMockSelect( selectors );
	return {
		useSelect: ( mapSelect ) => mapSelect( mockSelect ),
		useDispatch: () => mockDispatch,
	};
}

storiesOf( 'Analytics Module', module )
	.add( 'Account Property Profile Select (none selected)', () => {
		const dataProps = makeDataProps( {
			...defaultSelectors,
			getAccountID: () => '',
			getPropertyID: () => '',
			getProfileID: () => '',
		} );

		return (
			<SetupWrap>
				<div className="googlesitekit-setup-module__inputs">
					<AccountSelect { ...dataProps } />
					<PropertySelect { ...dataProps } />
					<ProfileSelect { ...dataProps } />
				</div>
			</SetupWrap>
		);
	} )
	.add( 'Account Property Profile Select (all selected)', () => {
		const dataProps = makeDataProps();

		return (
			<SetupWrap>
				<div className="googlesitekit-setup-module__inputs">
					<AccountSelect { ...dataProps } />
					<PropertySelect { ...dataProps } />
					<ProfileSelect { ...dataProps } />
				</div>
			</SetupWrap>
		);
	} )
	.add( 'Audience Overview Chart', () => {
		global.googlesitekit = analyticsData;

		const selectedStats = [
			0,
		];
		const series = {
			0: {
				color: '#4285f4',
				targetAxisIndex: 0,
			},
			1: {
				color: '#4285f4',
				targetAxisIndex: 0,
				lineDashStyle: [
					3,
					3,
				],
				lineWidth: 1,
			},
		};
		const vAxes = null;

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
		global.googlesitekit = analyticsData;

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
				footer
				title={ __( 'Top acquisition sources over the last 28 days', 'google-site-kit' ) }
				headerCtaLink="https://analytics.google.com"
				headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
				footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
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
							<DashboardAcquisitionPieChart />
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-8-desktop
							mdc-layout-grid__cell--span-8-tablet
							mdc-layout-grid__cell--span-4-phone
						">
							<AnalyticsDashboardWidgetTopAcquisitionSources />
						</div>
					</div>
				</div>
			</Layout>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } );
