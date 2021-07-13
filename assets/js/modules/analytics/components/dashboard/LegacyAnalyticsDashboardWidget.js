/**
 * AnalyticsDashboardWidget component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AnalyticsIcon from '../../../../../svg/analytics.svg';
import LegacyAnalyticsDashboardWidgetSiteStats from './LegacyAnalyticsDashboardWidgetSiteStats';
import LegacyAnalyticsDashboardWidgetTopPagesTable from './LegacyAnalyticsDashboardWidgetTopPagesTable';
import LegacyAnalyticsDashboardWidgetOverview from './LegacyAnalyticsDashboardWidgetOverview';
import LegacyAnalyticsDashboardWidgetTopAcquisitionSources from './LegacyAnalyticsDashboardWidgetTopAcquisitionSources';
import Layout from '../../../../components/layout/Layout';
import PageHeader from '../../../../components/PageHeader';
import LegacyDashboardAcquisitionPieChart from './LegacyDashboardAcquisitionPieChart';
import ProgressBar from '../../../../components/ProgressBar';
import getNoDataComponent from '../../../../components/legacy-notifications/nodata';
import getDataErrorComponent from '../../../../components/legacy-notifications/data-error';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../datastore/constants';
const { useSelect } = Data;

export default function LegacyAnalyticsDashboardWidget() {
	const [ selectedStats, setSelectedStats ] = useState( [ 0 ] );
	const [ receivingData, setReceivingData ] = useState( true );
	const [ error, setError ] = useState( false );
	const [ errorObj, setErrorObj ] = useState();
	const [ loading, setLoading ] = useState( true );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );

	const topContentServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'content-pages' ) );
	const topAcquisitionServiceURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'trafficsources-overview' ) );
	const visitorsOverview = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( 'visitors-overview' ) );

	const handleStatSelection = ( stat ) => {
		setSelectedStats( [ stat ] );
	};

	/**
	 * Handles data errors from the contained Analytics component(s).
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
	 * @param {string} err    A potential error string.
	 * @param {Object} errObj Full error object.
	 */
	const handleDataError = ( err, errObj ) => {
		setReceivingData( false );
		setLoading( false );
		setError( err );
		setErrorObj( errObj );
	};

	/**
	 * Sets Loading to false until data starts to resolve.
	 */
	const handleDataSuccess = () => {
		setReceivingData( true );
		setLoading( false );
	};

	const buildSeries = () => {
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
	};

	const series = buildSeries();
	const vAxes = null;

	// Hide Analytics data display when we don't have data.
	const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	return (
		<Fragment>
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
							/>
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
								title={ sprintf(
									/* translators: %s: number of days */
									_n( 'Audience overview for the last %s day', 'Audience overview for the last %s days', currentDayCount, 'google-site-kit', ),
									currentDayCount,
								) }
								headerCTALabel={ sprintf(
									/* translators: %s: module name. */
									__( 'See full stats in %s', 'google-site-kit' ),
									_x( 'Analytics', 'Service name', 'google-site-kit' )
								) }
								headerCTALink={ visitorsOverview }
							>
								<LegacyAnalyticsDashboardWidgetOverview
									selectedStats={ selectedStats }
									handleStatSelection={ handleStatSelection }
									handleDataError={ handleDataError }
									handleDataSuccess={ handleDataSuccess }
								/>
								<LegacyAnalyticsDashboardWidgetSiteStats
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
								title={ sprintf(
									/* translators: %s: number of days */
									_n( 'Top content over the last %s day', 'Top content over the last %s days', currentDayCount, 'google-site-kit', ),
									currentDayCount,
								) }
								headerCTALink={ topContentServiceURL }
								headerCTALabel={ sprintf(
									/* translators: %s: module name. */
									__( 'See full stats in %s', 'google-site-kit' ),
									_x( 'Analytics', 'Service name', 'google-site-kit' )
								) }
								footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
								footerCTALink={ topContentServiceURL }
							>
								<LegacyAnalyticsDashboardWidgetTopPagesTable />
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
								title={ sprintf(
									/* translators: %s: number of days */
									_n( 'Top acquisition channels over the last %s day', 'Top acquisition channels over the last %s days', currentDayCount, 'google-site-kit', ),
									currentDayCount,
								) }
								headerCTALink={ topAcquisitionServiceURL }
								headerCTALabel={ sprintf(
									/* translators: %s: module name. */
									__( 'See full stats in %s', 'google-site-kit' ),
									_x( 'Analytics', 'Service name', 'google-site-kit' )
								) }
								footerCTALabel={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
								footerCTALink={ topAcquisitionServiceURL }
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
					</div>
				</div>
			</div>
		</Fragment>
	);
}
