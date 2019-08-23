/**
 * AdSenseEstimateEarningsWidget component.
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
import DataBlock from 'GoogleComponents/data-block.js';
import PreviewBlock from 'GoogleComponents/preview-block';
import {
	getTimeInSeconds,
	readableLargeNumber,
} from 'GoogleUtil';
import withData from 'GoogleComponents/higherorder/withdata';
/**
 * Internal dependencies
 */
import { isDataZeroAdSense } from '../util';

const { __ } = wp.i18n;
const { Component } = wp.element;

class AdSenseEstimateEarningsWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			refetch: false,
			today: false,
			yesterday: false,
			sevenDays: false,
			month: false,
			twentyEightDays: false,
			sameDayLastWeek: false,
			prev7Days: false,
			monthLastYear: false,
			prev28Days: false,
			error: false,
			message: '',
		};
	}

	// When additional data is returned, componentDidUpdate will fire.
	componentDidUpdate( prevProps ) {
		const {
			data,
			datapoint,
		} = this.props;

		this.processCallbackData( data, datapoint, prevProps );
	}

	componentDidMount() {
		const {
			data,
			datapoint,
		} = this.props;

		this.processCallbackData( data, datapoint );
	}

	/**
	 * Process callback data received from the API.
	 *
	 * @param {Object} data Response data from the API.
	 * @param {string} datapoint data point for the callback conditional.
	 * @return {null}
	 */
	processCallbackData( data, datapoint ) {
		if ( ! data ) {
			return null;
		}

		switch ( datapoint ) {
			case 'earning-today':
				if ( data !== this.state.today ) {
					this.setState( {
						today: data,
					} );
				}
				break;
			case 'earning-yesterday':
				if ( data !== this.state.yesterday ) {
					this.setState( {
						yesterday: data,
					} );
				}
				break;
			case 'earning-samedaylastweek':
				if ( data !== this.state.sameDayLastWeek ) {
					this.setState( {
						sameDayLastWeek: data,
					} );
				}
				break;
			case 'earning-7days':
				if ( data !== this.state.sevenDays ) {
					this.setState( {
						sevenDays: data,
					} );
				}
				break;
			case 'earning-prev7days':
				if ( data !== this.state.prev7Days ) {
					this.setState( {
						prev7Days: data,
					} );
				}
				break;
			case 'earning-this-month':
				if ( data !== this.state.month ) {
					this.setState( {
						month: data,
					} );
				}
				break;
			case 'earning-this-month-last-year':
				if ( data !== this.state.monthLastYear ) {
					this.setState( {
						monthLastYear: data,
					} );
				}
				break;
			case 'earning-28days':
				if ( data !== this.state.twentyEightDays ) {
					this.setState( {
						twentyEightDays: data,
					} );
				}
				break;
			case 'earning-prev28days':
				if ( data !== this.state.prev28Days ) {
					this.setState( {
						prev28Days: data,
					} );
				}
				break;
		}
	}

	static renderLayout( dataBlocks ) {
		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{
						dataBlocks.map( ( block, i ) => {
							return (
								<div key={ i } className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--align-top
									mdc-layout-grid__cell--span-2-phone
									mdc-layout-grid__cell--span-2-tablet
									mdc-layout-grid__cell--span-4-desktop
								">
									<DataBlock
										stat={ i }
										className={ block.className }
										title={ block.title }
										datapoint={ block.datapoint }
										change={ block.change }
										changeDataUnit={ block.changeDataUnit }
										context={ block.context }
										selected={ block.selected }
										handleStatSelection={ block.handleStatSelection }
									/>
								</div>
							);
						} )
					}
				</div>
			</section>
		);
	}

	static renderPreviews() {
		// Create our grid cells for the preview blocks.
		const previewBlocks = [];
		{
			for ( let i = 0; 5 > i; i++ ) {
				previewBlocks.push(
					<div key={ i } className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--align-top
						mdc-layout-grid__cell--span-2-phone
						mdc-layout-grid__cell--span-2-tablet
						mdc-layout-grid__cell--span-4-desktop
					">
						<PreviewBlock width="100%" height="104px" />
					</div>
				);
			}
		}

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{ previewBlocks }
				</div>
			</section>
		);
	}

	render() {
		const {
			today,
			yesterday,
			sevenDays,
			month,
			twentyEightDays,
			sameDayLastWeek,
			prev7Days,
			monthLastYear,
			prev28Days,
		} = this.state;

		// Wait for all data to be set.
		if (
			! today ||
			! yesterday ||
			! sevenDays ||
			! month ||
			! twentyEightDays ||
			! sameDayLastWeek ||
			! prev7Days ||
			! monthLastYear ||
			! prev28Days
		) {
			return null;
		}

		const currencyHeader = today.headers.find( ( header ) => null !== header.currency && 0 < header.currency.length );
		const currencyCode = currencyHeader ? currencyHeader.currency : false;

		const dataBlocks = today.totals ? [
			{
				className: 'googlesitekit-data-block--today',
				title: __( 'Today so far', 'google-site-kit' ),
				datapoint: readableLargeNumber( today.totals[ 0 ], currencyCode ),
			},
			{
				className: 'googlesitekit-data-block--yesterday',
				title: __( 'Yesterday', 'google-site-kit' ),
				datapoint: readableLargeNumber( yesterday.totals[ 0 ], currencyCode ),
				change: sameDayLastWeek.totals[ 0 ],
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--7days',
				title: __( 'Last 7 days', 'google-site-kit' ),
				datapoint: readableLargeNumber( sevenDays.totals[ 0 ], currencyCode ),
				change: prev7Days.totals[ 0 ],
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--month',
				title: __( 'This month', 'google-site-kit' ),
				datapoint: readableLargeNumber( month.totals[ 0 ], currencyCode ),
				change: monthLastYear.totals[ 0 ],
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--28days',
				title: __( 'Last 28 days', 'google-site-kit' ),
				datapoint: readableLargeNumber( twentyEightDays.totals[ 0 ], currencyCode ),
				change: prev28Days.totals[ 0 ],
				changeDataUnit: '%',
			},
		] : [];

		return (
			AdSenseEstimateEarningsWidget.renderLayout( dataBlocks )
		);
	}
}

const isDataZero = ( data, datapoint ) => {
	if ( 'earning-28days' !== datapoint ) {
		return false;
	}

	return isDataZeroAdSense( data );
};

export default withData(
	AdSenseEstimateEarningsWidget,
	[
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-today',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-yesterday',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-samedaylastweek',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-7days',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-prev7days',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-this-month',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-this-month-last-year',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-28days',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
		{
			type: 'modules',
			identifier: 'adsense',
			datapoint: 'earning-prev28days',
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	AdSenseEstimateEarningsWidget.renderPreviews(),
	{ createGrid: true },
	isDataZero,
);
