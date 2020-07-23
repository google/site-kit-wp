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
import { Component, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../../../../components/header';
import SearchConsoleDashboardWidgetSiteStats from './SearchConsoleDashboardWidgetSiteStats';
import SearchConsoleDashboardWidgetKeywordTable from './SearchConsoleDashboardWidgetKeywordTable';
import SearchConsoleDashboardWidgetOverview from './SearchConsoleDashboardWidgetOverview';
import PageHeader from '../../../../components/page-header';
import Layout from '../../../../components/layout/layout';
import Alert from '../../../../components/alert';
import ProgressBar from '../../../../components/progress-bar';
import getNoDataComponent from '../../../../components/notifications/nodata';
import getDataErrorComponent from '../../../../components/notifications/data-error';
import { getCurrentDateRange } from '../../../../util/date-range';
import HelpLink from '../../../../components/help-link';
import { getModulesData } from '../../../../util';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
const { withSelect } = Data;

class GoogleSitekitSearchConsoleDashboardWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selectedStats: [ 0, 1 ],
			receivingData: true,
			error: false,
			loading: true,
		};

		this.handleStatSelection = this.handleStatSelection.bind( this );
		this.buildSeries = this.buildSeries.bind( this );
		this.buildVAxes = this.buildVAxes.bind( this );
		this.handleDataError = this.handleDataError.bind( this );
		this.handleDataSuccess = this.handleDataSuccess.bind( this );
	}

	/**
	 * Handle data errors from the contained AdSense component(s).
	 *
	 * Currently handled in the SearchConsoleDashboardWidgetOverview component.
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
			loading: false,
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

	handleStatSelection( stat ) {
		const { selectedStats } = this.state;
		let newStats = selectedStats.slice();

		if ( selectedStats.includes( stat ) ) {
			newStats = selectedStats.filter( ( selected ) => stat !== selected );
		} else {
			newStats.push( stat );
		}

		if ( 0 === newStats.length ) {
			return;
		}

		this.setState( { selectedStats: newStats } );
	}

	buildSeries() {
		const { selectedStats } = this.state;

		const colorMap = {
			0: '#4285f4',
			1: '#27bcd4',
			2: '#1b9688',
			3: '#673ab7',
		};

		return selectedStats.map( function( stat, i ) {
			return { color: colorMap[ stat ], targetAxisIndex: i };
		} );
	}

	buildVAxes() {
		const { selectedStats } = this.state;

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
	}

	render() {
		const {
			selectedStats,
			receivingData,
			error,
			errorObj,
			loading,
		} = this.state;

		const {
			dateRange,
		} = this.props;

		const series = this.buildSeries();
		const vAxes = this.buildVAxes();

		// Hide AdSense data display when we don't have data.
		const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
		const currentDateRange = getCurrentDateRange( dateRange );

		const searchConsoleDeepLink = sprintf( 'https://search.google.com/search-console?resource_id=%s', getModulesData()[ 'search-console' ].settings.propertyID );

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
								<PageHeader title={ _x( 'Search Console', 'Service name', 'google-site-kit' ) } icon iconWidth="23" iconHeight="21" iconID="search-console" status="connected" statusText={ __( 'Search Console is connected', 'google-site-kit' ) } />
								{ loading && <ProgressBar /> }
							</div>
							{ /* Data issue: on error display a notification. On missing data: display a CTA. */ }
							{ ! receivingData && (
								error ? getDataErrorComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ), error, true, true, true, errorObj ) : getNoDataComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ), true, true, true )
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
									headerCtaLabel={ __( 'See full stats in Search Console', 'google-site-kit' ) }
									headerCtaLink={ searchConsoleDeepLink }
								>
									<SearchConsoleDashboardWidgetOverview
										selectedStats={ selectedStats }
										handleStatSelection={ this.handleStatSelection }
										handleDataError={ this.handleDataError }
										handleDataSuccess={ this.handleDataSuccess }
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
									headerCtaLabel={ __( 'See full stats in Search Console', 'google-site-kit' ) }
									headerCtaLink={ searchConsoleDeepLink }
									footerCtaLabel={ _x( 'Search Console', 'Service name', 'google-site-kit' ) }
									footerCtaLink={ searchConsoleDeepLink }
								>
									<SearchConsoleDashboardWidgetKeywordTable />
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
)( GoogleSitekitSearchConsoleDashboardWidget );
