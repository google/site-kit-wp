/**
 * AnalyticsDashboardWidgetOverview component.
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
import DataBlock from 'GoogleComponents/data-block';
import withData from 'GoogleComponents/higherorder/withdata';
import { TYPE_MODULES } from 'GoogleComponents/data';
import {
	getTimeInSeconds,
	prepareSecondsForDisplay,
	readableLargeNumber,
} from 'GoogleUtil';
/**
 * Internal dependencies
 */
import {
	calculateOverviewData,
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData,
	overviewReportDataDefaults,
	userReportDataDefaults,
} from '../util';
import PreviewBlock from 'GoogleComponents/preview-block';
import PropTypes from 'prop-types';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class AnalyticsDashboardWidgetOverview extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			report: false,
			directTotalUsers: false,
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
		const { selectedStats, handleStatSelection } = this.props;
		const { report, directTotalUsers } = this.state;

		if ( ! report || ! report.length || ! directTotalUsers ) {
			return null;
		}

		const overviewData = calculateOverviewData( report );

		if ( ! overviewData ) {
			return null;
		}

		const {
			totalSessions,
			averageBounceRate,
			averageSessionDuration,
			totalUsersChange,
			totalSessionsChange,
			averageBounceRateChange,
			averageSessionDurationChange,
		} = overviewData;

		const directTotalUsersData = get( directTotalUsers, '[0].data.totals[0].values[0]' );

		if ( ! directTotalUsersData ) {
			return null;
		}

		const dataBlocks = [
			{
				className: 'googlesitekit-data-block--users googlesitekit-data-block--button-1',
				title: __( 'Users', 'google-site-kit' ),
				datapoint: readableLargeNumber( directTotalUsersData ),
				change: totalUsersChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 0 ),
				handleStatSelection,
			},
			{
				className: 'googlesitekit-data-block--sessions googlesitekit-data-block--button-2',
				title: __( 'Sessions', 'google-site-kit' ),
				datapoint: readableLargeNumber( totalSessions ),
				change: totalSessionsChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 1 ),
				handleStatSelection,
			},
			{
				className: 'googlesitekit-data-block--bounce googlesitekit-data-block--button-3',
				title: __( 'Bounce Rate', 'google-site-kit' ),
				datapoint: Number( averageBounceRate ).toFixed( 2 ),
				change: averageBounceRateChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 2 ),
				handleStatSelection,
				datapointUnit: '%',
				invertChangeColor: true,
			},
			{
				className: 'googlesitekit-data-block--duration googlesitekit-data-block--button-4',
				title: __( 'Session Duration', 'google-site-kit' ),
				datapoint: prepareSecondsForDisplay( averageSessionDuration ),
				change: averageSessionDurationChange,
				changeDataUnit: '%',
				context: 'button',
				selected: selectedStats.includes( 3 ),
				handleStatSelection,
			},
		];

		return (
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
									datapointUnit={ block.datapointUnit }
									invertChangeColor={ block.invertChangeColor }
								/>
							</div>
						);
					} ) }
				</div>
			</section>
		);
	}
}

AnalyticsDashboardWidgetOverview.propTypes = {
	handleDataError: PropTypes.func.isRequired,
};

export default withData(
	AnalyticsDashboardWidgetOverview,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: overviewReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single', 'Dashboard' ],
			toState( state, { data } ) {
				if ( ! state.report ) {
					return {
						report: data,
					};
				}
			},
		},
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: userReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: [ 'Single' ],
			toState( state, { data } ) {
				if ( ! state.directTotalUsers ) {
					return {
						directTotalUsers: data,
					};
				}
			},
		},
	],
	<PreviewBlock width="100%" height="190px" padding />,
	{ createGrid: true },
	isDataZeroForReporting,
	getAnalyticsErrorMessageFromData
);
