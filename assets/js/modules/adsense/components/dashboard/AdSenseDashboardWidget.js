/**
 * AdSenseDashboardWidget component.
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
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __, _x, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AdSenseIcon from '../../../../../svg/adsense.svg';
import AdSensePerformanceWidget from './AdSensePerformanceWidget';
import LegacyDashboardAdSenseTopPages from './LegacyDashboardAdSenseTopPages';
import getNoDataComponent from '../../../../components/legacy-notifications/nodata';
import getDataErrorComponent from '../../../../components/legacy-notifications/data-error';
import ProgressBar from '../../../../components/ProgressBar';
import ModuleSettingsWarning from '../../../../components/legacy-notifications/module-settings-warning';
import PageHeader from '../../../../components/PageHeader';
import Layout from '../../../../components/layout/Layout';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME, DATE_RANGE_OFFSET } from '../../../adsense/datastore/constants';
import { Cell, Grid, Row } from '../../../../material-components';
import { getCurrentDateRangeDayCount } from '../../../../util/date-range';
import { generateDateRangeArgs } from '../../../adsense/util/report-date-range-args';

const { useSelect } = Data;

// Empty component to allow filtering in refactored version.
const AdSenseDashboardZeroData = withFilters( 'googlesitekit.AdSenseDashboardZeroData' )( () => null );

export default function AdSenseDashboardWidget() {
	const [ receivingData, setReceivingData ] = useState( true );
	const [ error, setError ] = useState( false );
	const [ errorObj, setErrorObj ] = useState();
	const [ loading, setLoading ] = useState( true );
	const [ zeroData, setZeroData ] = useState( false );

	const adSenseModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'adsense' ) );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} ) );
	const accountSiteURL = useSelect( ( select ) => select( STORE_NAME ).getServiceReportURL( generateDateRangeArgs( dateRangeDates ) ) );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const currentDayCount = getCurrentDateRangeDayCount( dateRange );

	/**
	 * Handles data errors from the contained AdSense component(s).
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
		setZeroData( false );
		setError( false );
	};

	/**
	 * Shows the "We're getting your site ready for ads. screen until we have data.".
	 */
	const handleZeroData = () => {
		setZeroData( true );
		setLoading( false );
	};

	// Hide AdSense data display when we don't have data.
	const wrapperClass = ( loading || ! receivingData || zeroData ) ? 'googlesitekit-nodata' : '';

	let moduleStatus;
	let moduleStatusText;
	if ( ! error && adSenseModuleConnected ) {
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
							/>
							{ loading && <ProgressBar /> }
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
							<ModuleSettingsWarning slug="adsense" />
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
								headerCTALink={ accountSiteURL }
							>
								<AdSensePerformanceWidget
									handleDataError={ ( err ) => {
										// If there is no error, it is a zero data condition, otherwise call the error handler.
										if ( ! err ) {
											handleZeroData();
										} else {
											handleDataError();
										}
									} }
									handleDataSuccess={ handleDataSuccess }
								/>
							</Layout>
						</Cell>

						<Cell className={ wrapperClass } size={ 12 }>
							<LegacyDashboardAdSenseTopPages />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}

