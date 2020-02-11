/**
 * AnalyticsDashboardWidget component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import Header from 'GoogleComponents/header';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AnalyticsDashboardWidgetSiteStats from './dashboard-widget-sitestats';
import AnalyticsDashboardWidgetTopPagesTable from './dashboard-widget-top-pages-table';
import AnalyticsDashboardWidgetOverview from './dashboard-widget-overview';
import AnalyticsDashboardWidgetTopAcquisitionSources from './dashboard-widget-top-acquisition-sources-table';
import Layout from 'GoogleComponents/layout/layout';
import PageHeader from 'GoogleComponents/page-header';
import DashboardAcquisitionPieChart from './dashboard-widget-acquisition-piechart';
import Alert from 'GoogleComponents/alert';
import ProgressBar from 'GoogleComponents/progress-bar';
import getNoDataComponent from 'GoogleComponents/notifications/nodata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import AdSenseDashboardOutro from 'GoogleModules/adsense/dashboard/dashboard-outro';
import { isAdsenseConnectedAnalytics } from 'GoogleModules/adsense/util';
import { getDateRangeFrom } from 'GoogleUtil';
import HelpLink from 'GoogleComponents/help-link';

class AnalyticsDashboardWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selectedStats: [ 0 ],
			receivingData: true,
			error: false,
			loading: true,
			isAdSenseConnected: true,
		};

		this.handleStatSelection = this.handleStatSelection.bind( this );
		this.buildSeries = this.buildSeries.bind( this );
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
	}

	componentDidMount() {
		this.isAdSenseConnected();
	}

	async isAdSenseConnected() {
		const adsenseConnect = await isAdsenseConnectedAnalytics();

		if ( adsenseConnect ) {
			this.setState( {
				isAdSenseConnected: true,
			} );
		} else {
			this.setState( {
				isAdSenseConnected: false,
			} );
		}
	}

	handleStatSelection( stat ) {
		this.setState( { selectedStats: [ stat ] } );
	}

	/**
	 * Handle data errors from the contained Analytics component(s).
	 *
	 * Currently handled in the AnalyticsDashboardWidget component.
	 *
	 * If this component's API data calls returns an error, the error message is passed to this callback, resulting in the display of an error Notification.
	 *
	 * If the component detects no data - in this case all 0s - the callback is called without an error message,
	 * resulting in the display of a CTA.
	 *
	 * @param {string} error A potential error string.
	 */
	handleDataError( error ) {
		this.setState( {
			receivingData: false,
			loading: false,
			error,
		} );
	}

	/**
	 * Loading is set to false until data starts to resolve.
	 */
	handleDataSuccess() {
		this.setState( {
			receivingData: true,
			loading: false,
		} );
	}

	buildSeries() {
		const { selectedStats } = this.state;

		const colorMap = {
			0: '#4285f4',
			1: '#27bcd4',
			2: '#1b9688',
			3: '#673ab7',
		};

		return {
			0: {
				color: colorMap[ selectedStats ],
				targetAxisIndex: 0,
			},
			1: {
				color: colorMap[ selectedStats ],
				targetAxisIndex: 0,
				lineDashStyle: [ 3, 3 ],
				lineWidth: 1,
			},
		};
	}

	render() {
		const {
			selectedStats,
			error,
			receivingData,
			loading,
			isAdSenseConnected,
		} = this.state;

		const series = this.buildSeries();
		const vAxes = null;

		// Hide Analytics data display when we don't have data.
		const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
		const dateRangeFrom = getDateRangeFrom();

		return (
			<Fragment>
				<Header />
				<Alert module="analytics" />
				<div className="googlesitekit-module-page googlesitekit-module-page--analytics">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<PageHeader title={ _x( 'Analytics', 'Service name', 'google-site-kit' ) } icon iconWidth="24" iconHeight="26" iconID="analytics" status="connected" statusText={ __( 'Analytics is connected', 'google-site-kit' ) } />
								{ loading && <ProgressBar /> }
							</div>
							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ ! receivingData && (
								error ? getDataErrorComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), error, true, true, true ) : getNoDataComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), true, true, true )
							) }
							<div className={ classnames( `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12`,
							wrapperClass
							) }>
								<Layout
									header
									title={ sprintf( __( 'Audience overview for the last %s', 'google-site-kit' ), dateRangeFrom ) }
									headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
									headerCtaLink="http://analytics.google.com"
								>
									<AnalyticsDashboardWidgetOverview
										selectedStats={ selectedStats }
										handleStatSelection={ this.handleStatSelection }
										handleDataError={ this.handleDataError }
										handleDataSuccess={ this.handleDataSuccess }
									/>
									<AnalyticsDashboardWidgetSiteStats
										selectedStats={ selectedStats }
										series={ series }
										vAxes={ vAxes }
										dateRangeFrom={ dateRangeFrom }
									/>
								</Layout>
							</div>
							<div className={ classnames( `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12`,
							wrapperClass
							) }>
								<Layout
									header
									footer
									title={ sprintf( __( 'Top content over the last %s', 'google-site-kit' ), dateRangeFrom ) }
									headerCtaLink="https://analytics.google.com"
									headerCtaLabel={ __( 'See full stats in Analytics', 'google-site-kit' ) }
									footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
									footerCtaLink="https://analytics.google.com"
								>
									<AnalyticsDashboardWidgetTopPagesTable />
								</Layout>
							</div>
							<div className={ classnames( `
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12`,
							wrapperClass
							) }>
								<Layout
									header
									footer
									title={ sprintf( __( 'Top acquisition sources over the last %s', 'google-site-kit' ), dateRangeFrom ) }
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
							</div>
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								mdc-layout-grid__cell--align-right
							">
								<HelpLink />
							</div>
						</div>
					</div>
				</div>
				{ ! loading && ! isAdSenseConnected &&
					<AdSenseDashboardOutro />
				}
			</Fragment>
		);
	}
}

export default AnalyticsDashboardWidget;
