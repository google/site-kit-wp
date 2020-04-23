/**
 * AdSenseDashboardMainSummary component.
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
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	reduceAdSenseData,
	isDataZeroAdSense,
} from '../util';
import Layout from '../../../components/layout/layout';
import withData from '../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../components/data';
import PreviewBlock from '../../../components/preview-block';
import {
	getTimeInSeconds,
	readableLargeNumber,
	extractForSparkline,
	getSiteKitAdminURL,
} from '../../../util';
import DataBlock from '../../../components/data-block';
import Sparkline from '../../../components/sparkline';

class AdSenseDashboardMainSummary extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			today: false,
			period: false,
			daily: false,
		};
	}

	// When additional data is returned, componentDidUpdate will fire.
	componentDidUpdate() {
		this.processCallbackData();
	}

	componentDidMount() {
		this.processCallbackData();
	}

	/**
	 * Process callback data received from the API.
	 */
	processCallbackData() {
		const {
			data,
			requestDataToState,
		} = this.props;

		if ( data && ! data.error && 'function' === typeof requestDataToState ) {
			this.setState( requestDataToState );
		}
	}

	render() {
		const {
			today,
			period,
			daily,
		} = this.state;

		if ( ! today || ! period || ! daily || ! period.totals ) {
			return (
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-6-desktop
					mdc-layout-grid__cell--span-4-tablet
				">
					<Layout className="googlesitekit-dashboard-adsense-stats" fill>
						<PreviewBlock width="100%" height="276px" padding />
					</Layout>
				</div>
			);
		}

		const processedData = reduceAdSenseData( daily.rows );

		const href = getSiteKitAdminURL(
			'googlesitekit-module-adsense',
			{}
		);

		const currencyHeader = period.headers.find( ( header ) => null !== header.currency && 0 < header.currency.length );
		const currencyCode = currencyHeader ? currencyHeader.currency : false;

		return (
			<Fragment>
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-6-desktop
					mdc-layout-grid__cell--span-4-tablet
				">
					<Layout className="googlesitekit-dashboard-adsense-stats" fill>
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<DataBlock
										className="overview-adsense-rpm"
										title={ __( 'RPM', 'google-site-kit' ) }
										datapoint={ readableLargeNumber( period.totals[ 1 ], currencyCode ) }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 2 ) }
												change={ 1 }
												loadSmall={ false }
											/>
										}
										context="compact"
									/>
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<DataBlock
										className="overview-adsense-earnings"
										title={ __( 'Total Earnings', 'google-site-kit' ) }
										datapoint={ readableLargeNumber( period.totals[ 0 ], currencyCode ) }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										change={ today.totals[ 0 ] }
										changeDataUnit={ '$' }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 1 ) }
												change={ 1 }
												loadSmall={ false }
											/>
										}
										context="compact"
									/>
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<DataBlock
										className="overview-adsense-impressions"
										title={ __( 'Ad Impressions', 'google-site-kit' ) }
										datapoint={ readableLargeNumber( period.totals[ 2 ] ) }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 3 ) }
												change={ 1 }
												loadSmall={ false }
											/>
										}
										context="compact"
									/>
								</div>
							</div>
						</div>
					</Layout>
				</div>
			</Fragment>
		);
	}
}

export default withData(
	AdSenseDashboardMainSummary,
	[
		{
			type: TYPE_MODULES,
			identifier: 'adsense',
			datapoint: 'earnings',
			data: {
				dateRange: 'today',
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( ! state.today ) {
					return {
						today: data,
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'adsense',
			datapoint: 'earnings',
			data: {
				// dateRange not set here to inherit from googlesitekit.dateRange filter: last-x-days
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( ! state.period ) {
					return {
						period: data,
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'adsense',
			datapoint: 'earnings',
			data: {
				dateRange: 'this-month',
				dimensions: [ 'DATE' ],
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
			toState( state, { data } ) {
				if ( ! state.daily ) {
					return {
						daily: data,
					};
				}
			},
		},
	],
	<div className="
		mdc-layout-grid__cell
		mdc-layout-grid__cell--span-6-desktop
		mdc-layout-grid__cell--span-4-tablet
	">
		<Layout className="googlesitekit-dashboard-adsense-stats" fill>
			<PreviewBlock width="100%" height="276px" padding />
		</Layout>
	</div>,
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZeroAdSense
);
