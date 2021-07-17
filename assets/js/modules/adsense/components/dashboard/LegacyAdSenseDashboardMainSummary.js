/**
 * LegacyAdSenseDashboardMainSummary component.
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
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	reduceAdSenseData,
	isDataZeroAdSense,
} from '../../util';
import Layout from '../../../../components/layout/Layout';
import withData from '../../../../components/higherorder/withData';
import { TYPE_MODULES } from '../../../../components/data';
import PreviewBlock from '../../../../components/PreviewBlock';
import { getTimeInSeconds } from '../../../../util';
import extractForSparkline from '../../../../util/extract-for-sparkline';
import DataBlock from '../../../../components/DataBlock';
import Sparkline from '../../../../components/Sparkline';
const { withSelect } = Data;

class LegacyAdSenseDashboardMainSummary extends Component {
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
		const { href } = this.props;

		const {
			today,
			period,
			daily,
		} = this.state;

		if ( ! today || ! period || ! daily || ! period?.totals?.cells ) {
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

		const currencyHeader = period.headers.find( ( header ) => null !== header.currencyCode && 0 < header.currencyCode.length );
		const currencyCode = currencyHeader ? currencyHeader.currencyCode : false;

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
										title={ __( 'Page RPM', 'google-site-kit' ) }
										datapoint={ period.totals.cells[ 1 ].value }
										datapointUnit={ currencyCode }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 2 ) }
												change={ 1 }
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
										datapoint={ period.totals.cells[ 0 ].value }
										datapointUnit={ currencyCode }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										change={ today.totals.cells[ 0 ].value }
										changeDataUnit={ currencyCode }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 1 ) }
												change={ 1 }
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
										datapoint={ period.totals.cells[ 2 ].value }
										source={ {
											name: _x( 'AdSense', 'Service name', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 3 ) }
												change={ 1 }
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

export default withSelect( ( select ) => {
	return {
		href: select( CORE_SITE ).getAdminURL( 'googlesitekit-module-adsense', {} ),
	};
} )( withData(
	LegacyAdSenseDashboardMainSummary,
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
				// dateRange not set here to inherit from googlesitekit.dateRange filter: last-x-days
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
) );
