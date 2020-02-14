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
import SearchConsoleDashboardWidgetSiteStats from './dashboard-widget-sitestats';
import SearchConsoleDashboardWidgetKeywordTable from './dashboard-widget-keyword-table';
import SearchConsoleDashboardWidgetOverview from './dashboard-widget-overview';
import PageHeader from 'GoogleComponents/page-header';
import Layout from 'GoogleComponents/layout/layout';
import Alert from 'GoogleComponents/alert';
import ProgressBar from 'GoogleComponents/progress-bar';
import getNoDataComponent from 'GoogleComponents/notifications/nodata';
import getDataErrorComponent from 'GoogleComponents/notifications/data-error';
import { getDateRangeFrom } from 'GoogleUtil';
import HelpLink from 'GoogleComponents/help-link';

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
	 * @param {string} error A potential error string.
	 */
	handleDataError( error ) {
		this.setState( {
			receivingData: false,
			error,
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
			loading,
		} = this.state;

		const series = this.buildSeries();
		const vAxes = this.buildVAxes();

		// Hide AdSense data display when we don't have data.
		const wrapperClass = ! loading && receivingData ? '' : 'googlesitekit-nodata';
		const dateRangeFrom = getDateRangeFrom();

		const searchConsoleDeepLink = sprintf( 'https://search.google.com/u/1/search-console?resource_id=%s', global.googlesitekit.admin.siteURL );

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
								error ? getDataErrorComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ), error, true, true, true ) : getNoDataComponent( _x( 'Search Console', 'Service name', 'google-site-kit' ), true, true, true )
							) }
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								wrapperClass
							) }>
								<Layout
									header
									title={ sprintf( __( 'Overview for the last %s', 'google-site-kit' ), dateRangeFrom ) }
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
									title={ sprintf( __( 'Top search queries over the last %s', 'google-site-kit' ), dateRangeFrom ) }
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

export default GoogleSitekitSearchConsoleDashboardWidget;
