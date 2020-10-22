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
import AnalyticsDashboardWidgetOverview from '../assets/js/modules/analytics/components/dashboard/AnalyticsDashboardWidgetOverview';
import AnalyticsDashboardWidgetSiteStats from '../assets/js/modules/analytics/components/dashboard/AnalyticsDashboardWidgetSiteStats';
import LegacyDashboardAcquisitionPieChart from '../assets/js/modules/analytics/components/dashboard/LegacyDashboardAcquisitionPieChart';
import LegacyAnalyticsDashboardWidgetTopAcquisitionSources from '../assets/js/modules/analytics/components/dashboard/LegacyAnalyticsDashboardWidgetTopAcquisitionSources';
import { googlesitekit as analyticsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-module-analytics-googlesitekit';
import {
	AccountSelect,
	PropertySelect,
	ProfileSelect,
	AnonymizeIPSwitch,
	UseSnippetSwitch,
	TrackingExclusionSwitches,
	GA4Notice,
} from '../assets/js/modules/analytics/components/common';
import { WithTestRegistry } from '../tests/js/utils';

import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore/constants';

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

storiesOf( 'Analytics Module', module )
	.add( 'Account Property Profile Select (none selected)', () => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetSettings( {} );
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			// eslint-disable-next-line sitekit/camelcase-acronyms
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				// eslint-disable-next-line sitekit/camelcase-acronyms
				accountID: properties[ 0 ].accountId,
				// eslint-disable-next-line sitekit/camelcase-acronyms
				propertyID: profiles[ 0 ].webPropertyId,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
						<PropertySelect />
						<ProfileSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Account Property Profile Select (all selected)', () => {
		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			// eslint-disable-next-line sitekit/camelcase-acronyms
			dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				// eslint-disable-next-line sitekit/camelcase-acronyms
				accountID: properties[ 0 ].accountId,
				// eslint-disable-next-line sitekit/camelcase-acronyms
				propertyID: profiles[ 0 ].webPropertyId,
			} );
			dispatch( STORE_NAME ).receiveGetSettings( {
				// eslint-disable-next-line sitekit/camelcase-acronyms
				accountID: profiles[ 0 ].accountId,
				// eslint-disable-next-line sitekit/camelcase-acronyms
				propertyID: profiles[ 0 ].webPropertyId,
				// eslint-disable-next-line sitekit/camelcase-acronyms
				internalWebPropertyID: profiles[ 0 ].internalWebPropertyId,
				profileID: profiles[ 0 ].id,
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
						<PropertySelect />
						<ProfileSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Anonymize IP switch, toggled on', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
			dispatch( STORE_NAME ).setAnonymizeIP( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<AnonymizeIPSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Anonymize IP switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
			dispatch( STORE_NAME ).setAnonymizeIP( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<AnonymizeIPSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet switch, toggled on (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<UseSnippetSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setUseSnippet( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<UseSnippetSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Tracking exclusions (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setTrackingDisabled( [ 'loggedinUsers' ] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<TrackingExclusionSwitches />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Tracking exclusions (including loggedinUsers)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( STORE_NAME ).setTrackingDisabled( [] );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<TrackingExclusionSwitches />
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'GA4 notice', () => {
		return (
			<SetupWrap>
				<GA4Notice />
			</SetupWrap>
		);
	} )
	.add( 'Audience Overview Chart', () => {
		global._googlesitekitLegacyData = analyticsData;

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
				headerCTALabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
				headerCTALink="http://analytics.google.com"
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
		global._googlesitekitLegacyData = analyticsData;

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
					footer
					title={ __( 'Top acquisition channels over the last 28 days', 'google-site-kit' ) }
					headerCTALink="https://analytics.google.com"
					headerCTALabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
					footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					footerCTALink="https://analytics.google.com"
				>
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-4-desktop
								mdc-layout-grid__cell--span-8-tablet
								mdc-layout-grid__cell--span-4-phone
							">
								<LegacyDashboardAcquisitionPieChart />
							</div>
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-8-desktop
								mdc-layout-grid__cell--span-8-tablet
								mdc-layout-grid__cell--span-4-phone
							">
								<LegacyAnalyticsDashboardWidgetTopAcquisitionSources />
							</div>
						</div>
					</div>
				</Layout>
			</WithTestRegistry>
		);
	},
	{ options: { readySelector: '.googlesitekit-line-chart > div[style="position: relative;"]' } } );
