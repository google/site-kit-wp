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
import { Fragment, useState } from '@wordpress/element';
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
import HelpLink from '../../../../components/help-link';
import { getCurrentDateRange } from '../../../../util/date-range';
import Header from '../../../../components/header';
import PageHeader from '../../../../components/page-header';
import Layout from '../../../../components/layout/layout';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';

const { useSelect } = Data;

// Empty component to allow filtering in refactored version.
const AdSenseDashboardZeroData = withFilters( 'googlesitekit.AdSenseDashboardZeroData' )( () => null );

export default function AdSenseDashboardWidget() {
	const [ receivingData, setReceivingData ] = useState( true );
	const [ error, setError ] = useState( false );
	const [ errorObj, setErrorObj ] = useState( false );
	const [ zeroData, setZeroData ] = useState( false );

	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const isModuleConnected = useSelect( ( select ) => select( CORE_MODULES ).isModuleConnected( 'adsense' ) );
	const homepage = useSelect( ( select ) => select( STORE_NAME ).getServiceURL() );

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
	 * @param {string} receivedError     A potential error string.
	 * @param {Object} receivedErrorObj Full error object.
	 */
	const handleDataError = ( receivedError, receivedErrorObj ) => {
		setError( receivedError );
		setErrorObj( receivedErrorObj );
		setReceivingData( false );
	};

	/**
	 * Show the "We're getting your site ready for ads. screen until we have data.".
	 */
	const handleZeroData = () => {
		setZeroData( true );
	};

	/**
	 * Loading is set to false until data starts to resolve.
	 */
	const handleDataSuccess = () => {
		setReceivingData( true );
	};

	// Hide AdSense data display when we don't have data.
	const wrapperClass = ( ! receivingData || zeroData ) ? 'googlesitekit-nodata' : '';
	const currentDateRange = getCurrentDateRange( dateRange );

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
							{
								( ! error && isModuleConnected )
									? <PageHeader title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) } icon iconWidth="30" iconHeight="26" iconID="adsense" status="connected" statusText={ __( 'AdSense is connected', 'google-site-kit' ) } />
									: <PageHeader title={ _x( 'AdSense', 'Service name', 'google-site-kit' ) } icon iconWidth="30" iconHeight="26" iconID="adsense" status="not-connected" statusText={ __( 'AdSense is not connected', 'google-site-kit' ) } />
							}
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
								title={ sprintf( __( 'Top content over the last %s', 'google-site-kit' ), currentDateRange ) }
								headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
								headerCtaLink={ homepage }
							>
								<AdSensePerformanceWidget
									handleDataError={ ( err ) => {
										// If there is no error, it is a zero data condition.
										if ( ! err ) {
											handleZeroData();
										} else {
											handleDataError( err.message, err );
										}
									} }
									handleDataSuccess={ handleDataSuccess }
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
