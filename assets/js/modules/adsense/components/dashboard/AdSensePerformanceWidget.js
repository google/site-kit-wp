/**
 * AdSensePerformanceWidget component.
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
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { isUndefined } from 'lodash';

/**
 * Internal dependencies
 */
import {
	getTimeInSeconds,
	readableLargeNumber,
	changeToPercent,
	numberFormatWithUnit,
} from '../../../../util';
import { TYPE_MODULES } from '../../../../components/data';
import DataBlock from '../../../../components/data-block.js';
import PreviewBlock from '../../../../components/PreviewBlock';
import { isDataZeroAdSense } from '../../util';
import withData from '../../../../components/higherorder/withdata';

class AdSensePerformanceWidget extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			currentRangeData: false,
			prevRangeData: false,
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
			currentRangeData,
			prevRangeData,
		} = this.state;

		const dataBlocks = currentRangeData.totals ? [
			{
				className: 'googlesitekit-data-block--page-rpm',
				title: __( 'Earnings', 'google-site-kit' ),
				datapoint: readableLargeNumber( currentRangeData.totals[ 0 ], currentRangeData.headers[ 0 ]?.currency ),
				change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 0 ], currentRangeData.totals[ 0 ] ) : 0,
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--page-rpm',
				title: __( 'Page RPM', 'google-site-kit' ),
				datapoint: readableLargeNumber( currentRangeData.totals[ 1 ], currentRangeData.headers[ 1 ]?.currency ),
				change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 1 ], currentRangeData.totals[ 1 ] ) : 0,
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--impression',
				title: __( 'Impressions', 'google-site-kit' ),
				datapoint: readableLargeNumber( currentRangeData.totals[ 2 ] ),
				change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 2 ], currentRangeData.totals[ 2 ] ) : 0,
				changeDataUnit: '%',
			},
			{
				className: 'googlesitekit-data-block--impression',
				title: __( 'Page CTR', 'google-site-kit' ),
				/* translators: %s: percentage value. */
				datapoint: sprintf( _x( ' %1$s', 'AdSense performance Page CTA percentage', 'google-site-kit' ), numberFormatWithUnit( currentRangeData.totals[ 3 ] * 100, '%', { maximumFractionDigits: 2 } ) ),
				change: ( ! isUndefined( prevRangeData.totals ) ) ? changeToPercent( prevRangeData.totals[ 3 ], currentRangeData.totals[ 3 ] ) : 0,
				changeDataUnit: '%',
			},
		] : [];

		return (
			<section className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					{ dataBlocks.map( ( block, i ) => {
						return (
							<div key={ i } className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--align-top
								mdc-layout-grid__cell--span-2-phone
								mdc-layout-grid__cell--span-2-tablet
								mdc-layout-grid__cell--span-3-desktop
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
					} ) }
				</div>
			</section>
		);
	}
}

export default withData(
	AdSensePerformanceWidget,
	[
		{
			type: TYPE_MODULES,
			identifier: 'adsense',
			datapoint: 'earnings',
			data: {
				metrics: [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS', 'PAGE_VIEWS_CTR' ],
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
			toState( state, { data } ) {
				if ( ! state.currentRangeData ) {
					return {
						currentRangeData: data,
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'adsense',
			datapoint: 'earnings',
			data: {
				// This will be dynamically replaced with the previous date range based on the current date range.
				dateRange: 'prev-date-range-placeholder',
				metrics: [ 'EARNINGS', 'PAGE_VIEWS_RPM', 'IMPRESSIONS', 'PAGE_VIEWS_CTR' ],
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
			toState( state, { data } ) {
				if ( ! state.prevRangeData ) {
					return {
						prevRangeData: data,
					};
				}
			},
		},
	],
	<PreviewBlock width="100%" height="250px" />,
	{ createGrid: true },
	isDataZeroAdSense
);

