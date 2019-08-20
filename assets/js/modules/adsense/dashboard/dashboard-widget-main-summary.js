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

import withData from 'GoogleComponents/higherorder/withdata';
import PreviewBlock from 'GoogleComponents/preview-block';
import {
	getTimeInSeconds,
	readableLargeNumber,
	extractForSparkline,
	getSiteKitAdminURL,
} from 'GoogleUtil';
import DataBlock from 'GoogleComponents/data-block';
import Sparkline from 'GoogleComponents/sparkline';
import {
	reduceAdSenseData,
	isDataZeroAdSense,
} from '../util';
import Layout from 'GoogleComponents/layout/layout';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class AdSenseDashboardMainSummary extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			today: false,
			period: false,
			daily: false,
		};
	}

	setStateFromData( data, datapoint, prevProps = {} ) {
		if ( ! data ) {
			return null;
		}

		if ( 'earning-today' === datapoint && 'earning-today' !== prevProps.datapoint && ! this.state.today ) {
			this.setState( {
				today: data,
			} );
		}

		if ( 'earnings-this-period' === datapoint && 'earnings-this-period' !== prevProps.datapoint && ! this.state.period ) {
			this.setState( {
				period: data,
			} );
		}

		if ( 'earning-daily-this-month' === datapoint && 'earning-daily-this-month' !== prevProps.datapoint && ! this.state.daily ) {
			this.setState( {
				daily: data,
			} );
		}
	}

	// When the second dataset is returned, componentDidUpdate will fire.
	componentDidUpdate( prevProps ) {
		const { data, datapoint } = this.props;
		this.setStateFromData( data, datapoint, prevProps );
	}

	// Handle the first data returned in componentDisMount.
	componentDidMount() {
		const { data, datapoint } = this.props;
		this.setStateFromData( data, datapoint );
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
						<PreviewBlock width='100%' height='276px' padding />
					</Layout>
				</div>
			);
		}

		const processedData = reduceAdSenseData( daily.rows );

		const href = getSiteKitAdminURL(
			'googlesitekit-module-adsense',
			{}
		);

		const currency = period.headers.find( header => null !== header.currency && 0 < header.currency.length ).currency;

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
										datapoint={ readableLargeNumber( period.totals[1], currency ) }
										source={ {
											name: __( 'AdSense', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 2 ) }
												change={ 1 }
												id='adsense-rpm-sparkline'
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
										datapoint={ readableLargeNumber( period.totals[0], currency ) }
										source={ {
											name: __( 'AdSense', 'google-site-kit' ),
											link: href,
										} }
										change={ today.totals[0] }
										changeDataUnit={ '$' }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 1 ) }
												change={ 1 }
												id='adsense-earnings-sparkline'
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
										datapoint={ readableLargeNumber( period.totals[2] ) }
										source={ {
											name: __( 'AdSense', 'google-site-kit' ),
											link: href,
										} }
										sparkline={ daily &&
											<Sparkline
												data={ extractForSparkline( processedData.dataMap, 3 ) }
												change={ 1 }
												id='adsense-impressions-sparkline'
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

const isDataZero = ( data, datapoint ) => {
	if ( 'earnings-this-period' !== datapoint ) {
		return false;
	}

	return isDataZeroAdSense( data );
};

export default withData(
	AdSenseDashboardMainSummary,
	[
		{
			dataObject: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-today',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard'
		},
		{
			dataObject: 'modules',
			identifier: 'adsense',
			datapoint: 'earnings-this-period',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		},
		{
			dataObject: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-daily-this-month',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Dashboard',
		}
	],
	<div className="
		mdc-layout-grid__cell
		mdc-layout-grid__cell--span-6-desktop
		mdc-layout-grid__cell--span-4-tablet
	">
		<Layout className="googlesitekit-dashboard-adsense-stats" fill>
			<PreviewBlock width='100%' height='276px' padding />
		</Layout>
	</div>,
	{
		inGrid: true,
		createGrid: true,
	},
	isDataZero
);
