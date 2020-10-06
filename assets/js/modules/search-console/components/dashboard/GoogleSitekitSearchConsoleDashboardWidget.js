/**
 * GoogleSitekitSearchConsoleDashboardWidget component.
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
import { Fragment, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SearchConsoleIcon from '../../../../../svg/search-console.svg';
import Header from '../../../../components/header';
import SearchConsoleDashboardWidgetSiteStats from './SearchConsoleDashboardWidgetSiteStats';
import LegacySearchConsoleDashboardWidgetKeywordTable from './LegacySearchConsoleDashboardWidgetKeywordTable';
import SearchConsoleDashboardWidgetOverview from './SearchConsoleDashboardWidgetOverview';
import PageHeader from '../../../../components/page-header';
import PageHeaderDateRange from '../../../../components/page-header-date-range';
import Layout from '../../../../components/layout/layout';
import Alert from '../../../../components/alert';
import ProgressBar from '../../../../components/progress-bar';
import getNoDataComponent from '../../../../components/notifications/nodata';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import { getCurrentDateRange } from '../../../../util/date-range';
import HelpLink from '../../../../components/help-link';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

const { useSelect } = Data;

const GoogleSitekitSearchConsoleDashboardWidget = () => {
	const [ selectedStats, setSelectedStats ] = useState( [ 0, 1 ] );
	const [ receivingData, setReceivingData ] = useState( true );
	const [ error, setError ] = useState( false );
	const [ errorObj, setErrorObject ] = useState();
	const [ loading, setLoading ] = useState( true );
	const dateRange = useSelect( ( select ) => select( CORE_USER ).getDateRange() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const searchConsoleDeepLink = useSelect( ( select ) => select( STORE_NAME ).getServiceURL( { query: { resource_id: propertyID } } ) );

	/**
	 * Handles data errors from the contained AdSense component(s).
	 *
	 * Currently handled in the SearchConsoleDashboardWidgetOverview component.
	 *
	 * If this component's API data calls returns an error, the error message is passed to this callback, resulting in the display of an error Notification.
	 *
	 * If the component detects no data - in this case all 0s - the callback is called without an error message,
	 * resulting in the display of a CTA.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} receivedError    A potential error string.
	 * @param {Object} receivedErrorObj Full error object.
	 */
	const handleDataError = ( receivedError, receivedErrorObj ) => {
		setReceivingData( false );
		setError( receivedError );
		setErrorObject( receivedErrorObj );
		setLoading( false );
	};

	/**
	 * Sets loading to `false` and "receiving data" to `true` until data starts to resolve.
	 */
	const handleDataSuccess = () => {
		setReceivingData( true );
		setLoading( false );
	};

	const handleStatSelection = ( stat ) => {
		let newStats = selectedStats.slice();

		if ( selectedStats.includes( stat ) ) {
			newStats = selectedStats.filter( ( selected ) => stat !== selected );
		} else {
			newStats.push( stat );
		}

		if ( 0 === newStats.length ) {
			return;
		}
		setSelectedStats( newStats );
	};

	const buildSeries = () => {
		const colorMap = {
			0: '#4285f4',
			1: '#27bcd4',
			2: '#1b9688',
			3: '#673ab7',
		};

		return selectedStats.map( function( stat, i ) {
			return { color: colorMap[ stat ], targetAxisIndex: i };
		} );
	};

	const buildVAxes = () => {
		const vAxesMap = {
			0: __( 'Clicks', 'google-site-kit' ),
			1: __( 'Impressions', 'google-site-kit' ),
			2: __( 'Average CTR', 'google-site-kit' ),
			3: __( 'Average Position', 'google-site-kit' ),
		};

		return selectedStats.map( function( stat ) {
			const otherSettings = {};
			// The third index refers to the "Average Position" stat.
			// We need to reverse the y-axis for this stat, see:
			// https://github.com/google/site-kit-wp/issues/874
			if ( stat === 3 ) {
				otherSettings.direction = -1;
			}

			return { title: vAxesMap[ stat ], ...otherSettings };
		} );
	};

	const series = buildSeries();
	const vAxes = buildVAxes();

	// Hide AdSense data display when we don't have data.
	const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
	const currentDateRange = getCurrentDateRange( dateRange );

	return (
		<Fragment>
			<Header />
			<Alert module="search-console" />
			<div className="googlesitekit-module-page googlesitekit-module-page--search-console">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
							<PageHeader
								title={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								icon={
									<SearchConsoleIcon
										id="search-console"
										className="googlesitekit-page-header__icon"
										height="21"
										width="23"
									/>
								}
								status="connected"
								statusText={ sprintf(
									/* translators: %s: module name. */
									__( '%s is connected', 'google-site-kit' ),
									_x( 'Search Console', 'Service name', 'google-site-kit' )
								) }
							>
								<PageHeaderDateRange />
							</PageHeader>
							{ loading && <ProgressBar /> }
						</div>
						{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
						{ ! receivingData && (
							error ? getDataErrorComponent( 'search-console', error, true, true, true, errorObj ) : getNoDataComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ), true, true, true )
						) }
						<div className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-12',
							wrapperClass
						) }>
							<Layout
								header
								/* translators: %s: date range */
								title={ sprintf( __( 'Overview for the last %s', 'google-site-kit' ), currentDateRange ) }
								headerCtaLabel={ sprintf(
									/* translators: %s: module name. */
									__( 'See full stats in %s', 'google-site-kit' ),
									_x( 'Search Console', 'Service name', 'google-site-kit' )
								) }
								headerCtaLink={ searchConsoleDeepLink }
							>
								<SearchConsoleDashboardWidgetOverview
									selectedStats={ selectedStats }
									handleStatSelection={ handleStatSelection }
									handleDataError={ handleDataError }
									handleDataSuccess={ handleDataSuccess }
								/>
								<SearchConsoleDashboardWidgetSiteStats selectedStats={ selectedStats } series={ series } vAxes={ vAxes } />
							</Layout>
						</div>
						<div className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-12',
							wrapperClass
						) }>
							<Layout
								/* translators: %s: date range */
								title={ sprintf( __( 'Top search queries over the last %s', 'google-site-kit' ), currentDateRange ) }
								header
								footer
								headerCtaLabel={ sprintf(
									/* translators: %s: module name. */
									__( 'See full stats in %s', 'google-site-kit' ),
									_x( 'Search Console', 'Service name', 'google-site-kit' )
								) }
								headerCtaLink={ searchConsoleDeepLink }
								footerCtaLabel={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
								footerCtaLink={ searchConsoleDeepLink }
							>
								<LegacySearchConsoleDashboardWidgetKeywordTable />
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
};

export default GoogleSitekitSearchConsoleDashboardWidget;
