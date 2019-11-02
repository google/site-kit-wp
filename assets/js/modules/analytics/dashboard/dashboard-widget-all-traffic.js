/**
 * AnalyticsAllTraffic component.
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
 * Internal dependencies
 */
import DashboardAcquisitionPieChart from './dashboard-widget-acquisition-piechart';
import AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources from './dashboard-alltraffic-widget-top-acquisition-sources-table';
/**
 * External dependencies
 */
import Layout from 'GoogleComponents/layout/layout';
import DashboardModuleHeader from 'GoogleComponents/dashboard/dashboard-module-header';
import getNoDataComponent from 'GoogleComponents/notifications/nodata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import getSetupIncompleteComponent from 'GoogleComponents/notifications/setup-incomplete';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class AnalyticsAllTraffic extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			receivingData: true,
			error: false,
		};
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
	}

	/**
	 * Handle data errors from the contained Analytics component(s).
	 *
	 * Currently handled in the AdSenseEstimateEarningsWidget component.
	 *
	 * If this component's API data calls returns an error or empty results, this callback is invoke,
	 * resulting the hiding of this panel.
	 *
	 * @param {string} error A potential error string.
	 */
	handleDataError( error ) {
		this.setState( {
			receivingData: false,
			error,
		} );
	}

	handleDataSuccess() {
		this.setState( {
			receivingData: true,
		} );
	}

	getErrorDataComponent() {
		const {
			active,
			setupComplete,
		} = googlesitekit.modules.analytics;

		const {
			error,
			receivingData,
		} = this.state;

		if ( active && ! setupComplete ) {
			return getSetupIncompleteComponent( 'analytics', true, true, true );
		}

		if ( ! receivingData ) {
			return error ? getDataErrorComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), error, true, true, true ) : getNoDataComponent( _x( 'Analytics', 'Service name', 'google-site-kit' ), true, true, true );
		}

		return null;
	}

	render() {
		const {
			error,
			receivingData,
		} = this.state;

		const dataError = ( error || ! receivingData );
		const wrapperClass = dataError ? 'googlesitekit-nodata' : '';

		return (
			<Fragment>
				<div className={ `
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				` }>
					<DashboardModuleHeader timePeriod={ __( 'Last 28 days', 'google-site-kit' ) } description={ __( 'How people found your site.', 'google-site-kit' ) } title={ __( 'All Traffic', 'google-site-kit' ) } />

				</div>
				{ this.getErrorDataComponent() }
				<div className={ `
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
					${ wrapperClass }
				` }>
					<Layout className="googlesitekit-dashboard-all-traffic">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-4-desktop
									mdc-layout-grid__cell--span-4-tablet
									mdc-layout-grid__cell--span-4-phone
								">
									<DashboardAcquisitionPieChart
										source
										handleDataError={ this.handleDataError }
										handleDataSuccess={ this.handleDataSuccess }
									/>
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-8-desktop
									mdc-layout-grid__cell--span-4-tablet
									mdc-layout-grid__cell--span-4-phone
								">
									<AnalyticsAllTrafficDashboardWidgetTopAcquisitionSources />
								</div>
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default AnalyticsAllTraffic;
