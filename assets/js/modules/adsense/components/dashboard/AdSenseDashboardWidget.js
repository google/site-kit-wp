/**
 * AdSenseDashboardWidget component.
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
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __, _x, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdSenseIcon from '../../../../../svg/adsense.svg';
import AdSensePerformanceWidget from './AdSensePerformanceWidget';
import Alert from '../../../../components/alert';
import DashboardAdSenseTopPages from './DashboardAdSenseTopPages';
import getNoDataComponent from '../../../../components/notifications/nodata';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import ModuleSettingsWarning from '../../../../components/notifications/module-settings-warning';
import { getModulesData } from '../../../../util';
import HelpLink from '../../../../components/HelpLink';
import Header from '../../../../components/Header';
import PageHeader from '../../../../components/PageHeader';
import PageHeaderDateRange from '../../../../components/PageHeaderDateRange';
import Layout from '../../../../components/layout/layout';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';

const { withSelect } = Data;

// Empty component to allow filtering in refactored version.
const AdSenseDashboardZeroData = withFilters( 'googlesitekit.AdSenseDashboardZeroData' )( () => null );

class AdSenseDashboardWidget extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			receivingData: true,
			error: false,
			zeroData: false,
		};
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
		this.handleZeroData = this.handleZeroData.bind( this );
	}

	/**
	 * Handle data errors from the contained AdSense component(s).
	 *
	 * Currently handled in the AdSenseEstimateEarningsWidget component.
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
			error: false,
			zeroData: false,
		} );
	}

	/**
	 * Show the "We're getting your site ready for ads. screen until we have data.".
	 */
	handleZeroData() {
		this.setState( {
			zeroData: true,
		} );
	}

	render() {
		const modulesData = getModulesData();

		const {
			receivingData,
			error,
			errorObj,
			zeroData,
		} = this.state;

		const { dateRange } = this.props;
		const { homepage } = modulesData.adsense;

		// Hide AdSense data display when we don't have data.
		const wrapperClass = ( ! receivingData || zeroData ) ? 'googlesitekit-nodata' : '';
		const currentDayCount = getCurrentDateRangeDayCount( dateRange );

		let moduleStatus;
		let moduleStatusText;
		if ( ! error && modulesData.adsense.setupComplete ) {
			moduleStatus = 'connected';
			moduleStatusText = sprintf(
				/* translators: %s: module name. */
				__( '%s is connected', 'google-site-kit' ),
				_x( 'AdSense', 'Service name', 'google-site-kit' )
			);
		} else {
			moduleStatus = 'not-connected';
			moduleStatusText = sprintf(
				/* translators: %s: module name. */
				__( '%s is not connected', 'google-site-kit' ),
				_x( 'AdSense', 'Service name', 'google-site-kit' )
			);
		}

		return (
			<Fragment>
				<Header />
				<div className={ wrapperClass }>
					<Alert module="adsense" />
				</div>

				<div className="googlesitekit-module-page googlesitekit-module-page--adsense">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<PageHeader
									title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
									icon={
										<AdSenseIcon
											className="googlesitekit-page-header__icon"
											height="33"
											width="33"
										/>
									}
									status={ moduleStatus }
									statusText={ moduleStatusText }
								>
									<PageHeaderDateRange />
								</PageHeader>
							</Cell>

							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ zeroData &&
								<Cell size={ 12 }>
									<Layout fill>
										<AdSenseDashboardZeroData />
									</Layout>
								</Cell>
							}

							{ ! receivingData && (
								error ? getDataErrorComponent( 'adsense', error, true, true, true, errorObj ) : getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true )
							) }

							<Cell className={ wrapperClass } size={ 12 }>
								<ModuleSettingsWarning slug="adsense" context="module-dashboard" />
							</Cell>

							<Cell className={ wrapperClass } size={ 12 }>
								<Layout
									header
									title={ sprintf(
										/* translators: %s: number of days */
										_n( 'Performance over the last %s day', 'Performance over the last %s days', currentDayCount, 'google-site-kit' ),
										currentDayCount
									) }
									headerCTALabel={ __( 'See full stats in AdSense', 'google-site-kit' ) }
									headerCTALink={ homepage }
								>
									<AdSensePerformanceWidget
										handleDataError={ ( err ) => {
											// If there is no error, it is a zero data condition, otherwise call the error handler.
											if ( ! err ) {
												this.handleZeroData();
											} else {
												this.handleDataError();
											}
										} }
										handleDataSuccess={ this.handleDataSuccess }
									/>
								</Layout>
							</Cell>

							<Cell className={ wrapperClass } size={ 12 }>
								<DashboardAdSenseTopPages />
							</Cell>

							<Cell align="right" size={ 12 }>
								<HelpLink />
							</Cell>
						</Row>
					</Grid>
				</div>
			</Fragment>
		);
	}
}

export default withSelect( ( select ) => (
	{
		dateRange: select( CORE_USER ).getDateRange(),
	} )
)( AdSenseDashboardWidget );
