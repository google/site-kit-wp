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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdSensePerformanceWidget from './AdSensePerformanceWidget';
import Alert from '../../../../components/alert';
import DashboardAdSenseTopPages from './DashboardAdSenseTopPages';
import getNoDataComponent from '../../../../components/notifications/nodata';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import ModuleSettingsWarning from '../../../../components/notifications/module-settings-warning';
import { getModulesData } from '../../../../util';
import HelpLink from '../../../../components/help-link';
import Header from '../../../../components/header';
import PageHeader from '../../../../components/page-header';
import Layout from '../../../../components/layout/layout';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { getCurrentDateRange } from '../../../../util/date-range';

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
			loading,
			zeroData,
		} = this.state;

		const { dateRange } = this.props;
		const { homepage } = modulesData.adsense;

		// Hide AdSense data display when we don't have data.
		const wrapperClass = ( loading || ! receivingData || zeroData ) ? 'googlesitekit-nodata' : '';
		const currentDateRange = getCurrentDateRange( dateRange );

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
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<PageHeader
									title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
									icon
									iconWidth="30"
									iconHeight="26"
									iconID="adsense"
									status={ moduleStatus }
									statusText={ moduleStatusText }
								/>
							</div>
							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ zeroData &&
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<Layout fill>
										<AdSenseDashboardZeroData />
									</Layout>
								</div>
							}
							{ ! receivingData && (
								error ? getDataErrorComponent( 'adsense', error, true, true, true, errorObj ) : getNoDataComponent( _x( 'AdSense', 'Service name', 'google-site-kit' ), true, true, true )
							) }
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<ModuleSettingsWarning slug="adsense" context="module-dashboard" />
							</div>
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<Layout
									header
									/* translators: %s: date range */
									title={ sprintf( __( 'Performance over the last %s days', 'google-site-kit' ), currentDateRange ) }
									headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
									headerCtaLink={ homepage }
								>
									<AdSensePerformanceWidget
										handleDataError={ ( err ) => {
											// If there is no error, it is a zero data condition.
											if ( ! err ) {
												this.handleZeroData();
											}
										} }
									/>
								</Layout>
							</div>
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<DashboardAdSenseTopPages />
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

export default withSelect( ( select ) => (
	{
		dateRange: select( CORE_USER ).getDateRange(),
	} )
)( AdSenseDashboardWidget );
