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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AnalyticsIcon from '../../../../../svg/analytics.svg';
import Header from '../../../../components/header';
import AnalyticsDashboardWidgetSiteStats from './AnalyticsDashboardWidgetSiteStats';
import AnalyticsDashboardWidgetTopPagesTable from './AnalyticsDashboardWidgetTopPagesTable';
import AnalyticsDashboardWidgetOverview from './AnalyticsDashboardWidgetOverview';
import LegacyAnalyticsDashboardWidgetTopAcquisitionSources from './LegacyAnalyticsDashboardWidgetTopAcquisitionSources';
import Layout from '../../../../components/layout/layout';
import PageHeader from '../../../../components/page-header';
import PageHeaderDateRange from '../../../../components/page-header-date-range';
import LegacyDashboardAcquisitionPieChart from './LegacyDashboardAcquisitionPieChart';
import Alert from '../../../../components/alert';
import ProgressBar from '../../../../components/progress-bar';
import getNoDataComponent from '../../../../components/notifications/nodata';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import { getCurrentDateRange } from '../../../../util/date-range';
import HelpLink from '../../../../components/help-link';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
const { withSelect } = Data;

class AnalyticsDashboardWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selectedStats: [ 0 ],
			receivingData: true,
			error: false,
			loading: true,
		};

		this.handleStatSelection = this.handleStatSelection.bind( this );
		this.buildSeries = this.buildSeries.bind( this );
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
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
	 * @since 1.0.0
	 *
	 * @param {string} error    A potential error string.
	 * @param {Object} errorObj Full error object.
	 */
	handleDataError( error, errorObj ) {
		this.setState( {
			receivingData: false,
			loading: false,
			error,
			errorObj,
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
			errorObj,
			receivingData,
			loading,
		} = this.state;

		const {
			dateRange,
		} = this.props;

		const series = this.buildSeries();
		const vAxes = null;

		// Hide Analytics data display when we don't have data.
		const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
		const currentDateRange = getCurrentDateRange( dateRange );

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
								<PageHeader
									title={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
									icon={
										<AnalyticsIcon
											className="googlesitekit-page-header__icon"
											height="26"
											width="24"
										/>
									}
									status="connected"
									statusText={ sprintf(
										/* translators: %s: module name. */
										__( '%s is connected', 'google-site-kit' ),
										_x( 'Analytics', 'Service name', 'google-site-kit' )
									) }
								>
									<PageHeaderDateRange />
								</PageHeader>
								{ loading && <ProgressBar /> }
							</div>
							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ ! receivingData && (
								error ? getDataErrorComponent( 'analytics', error, true, true, true, errorObj ) : getNoDataComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), true, true, true )
							) }
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<Layout
									header
									/* translators: %s: date range */
									title={ sprintf( __( 'Audience overview for the last %s', 'google-site-kit' ), currentDateRange ) }
									headerCtaLabel={ sprintf(
										/* translators: %s: module name. */
										__( 'See full stats in %s', 'google-site-kit' ),
										_x( 'Analytics', 'Service name', 'google-site-kit' )
									) }
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
										dateRangeSlug={ dateRange }
									/>
								</Layout>
							</div>
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<Layout
									header
									footer
									/* translators: %s: date range */
									title={ sprintf( __( 'Top content over the last %s', 'google-site-kit' ), currentDateRange ) }
									headerCtaLink="https://analytics.google.com"
									headerCtaLabel={ sprintf(
										/* translators: %s: module name. */
										__( 'See full stats in %s', 'google-site-kit' ),
										_x( 'Analytics', 'Service name', 'google-site-kit' )
									) }
									footerCtaLabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
									footerCtaLink="https://analytics.google.com"
								>
									<AnalyticsDashboardWidgetTopPagesTable />
								</Layout>
							</div>
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<Layout
									header
									footer
									/* translators: %s: date range */
									title={ sprintf( __( 'Top acquisition channels over the last %s', 'google-site-kit' ), currentDateRange ) }
									headerCtaLink="https://analytics.google.com"
									headerCtaLabel={ sprintf(
										/* translators: %s: module name. */
										__( 'See full stats in %s', 'google-site-kit' ),
										_x( 'Analytics', 'Service name', 'google-site-kit' )
									) }
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
			</Fragment>
		);
	}
}

export default withSelect(
	( select ) => ( {
		dateRange: select( CORE_USER ).getDateRange(),
	} ),
)( AnalyticsDashboardWidget );
