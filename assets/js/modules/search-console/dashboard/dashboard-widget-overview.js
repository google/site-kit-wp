/**
 * SearchConsoleDashboardWidgetOverview component.
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
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import PreviewBlock from 'GoogleComponents/preview-block';
import { getTimeInSeconds } from 'GoogleUtil';
/**
 * Internal dependencies
 */
import {
	extractSearchConsoleDashboardData,
	isDataZeroSearchConsole,
} from './util';
import PropTypes from 'prop-types';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;

class SearchConsoleDashboardWidgetOverview extends Component {
	render() {
		const { data, selectedStats, handleStatSelection } = this.props;

		if ( ! data || ! data.length ) {
			return null;
		}
		const processedData = extractSearchConsoleDashboardData( data );

		const {
			totalClicks,
			totalImpressions,
			averageCTR,
			averagePosition,
			totalClicksChange,
			totalImpressionsChange,
			averageCTRChange,
			averagePositionChange,
		} = processedData;

		const dataBlocks = [
			{
				className: 'googlesitekit-data-block--clicks googlesitekit-data-block--button-1',
				title: __( 'Total Clicks', 'google-site-kit' ),
				datapoint: totalClicks,
				change: totalClicksChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 0 ),
				handleStatSelection,
			},
			{
				className: 'googlesitekit-data-block--impressions googlesitekit-data-block--button-2',
				title: __( 'Total Impressions', 'google-site-kit' ),
				datapoint: totalImpressions,
				change: totalImpressionsChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 1 ),
				handleStatSelection,
			},
			{
				className: 'googlesitekit-data-block--ctr googlesitekit-data-block--button-3',
				title: __( 'Average CTR', 'google-site-kit' ),
				datapoint: averageCTR + '%',
				change: averageCTRChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 2 ),
				handleStatSelection,
			},
			{
				className: 'googlesitekit-data-block--position googlesitekit-data-block--button-4',
				title: __( 'Average Position', 'google-site-kit' ),
				datapoint: averagePosition,
				change: averagePositionChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 3 ),
				handleStatSelection,
			},
		];

		return (
			<Fragment>
				<section className="mdc-layout-grid">
					<div
						className="mdc-layout-grid__inner"
						role="toolbar"
						aria-label="Line Chart Options"
					>
						{ dataBlocks.map( ( block, i ) => {
							return (
								<div key={ i } className="
									mdc-layout-grid__cell
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
			</Fragment>
		);
	}
}

SearchConsoleDashboardWidgetOverview.propTypes = {
	handleDataError: PropTypes.func.isRequired,
};

export default withData(
	SearchConsoleDashboardWidgetOverview,
	[
		{
			type: TYPE_MODULES,
			identifier: 'search-console',
			datapoint: 'searchanalytics',
			data: {
				dimensions: 'date',
				compareDateRanges: true,
			},
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
		},
	],
	<PreviewBlock width="100%" height="190px" padding />,
	{ createGrid: true },
	isDataZeroSearchConsole
);
