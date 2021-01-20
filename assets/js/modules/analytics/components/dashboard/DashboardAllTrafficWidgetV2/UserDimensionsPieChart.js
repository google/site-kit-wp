/**
 * UserDimensionsPieChart component
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
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME, FORM_ALL_TRAFFIC_WIDGET, DATE_RANGE_OFFSET } from '../../../datastore/constants';
import { numberFormat, sanitizeHTML } from '../../../../../util';
import { extractAnalyticsDataForPieChart, isZeroReport } from '../../../util';
import GoogleChart from '../../../../../components/GoogleChart';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
import ReportZero from '../../../../../components/ReportZero';
const { useSelect, useDispatch } = Data;

export default function UserDimensionsPieChart( { dimensionName, entityURL, sourceLink } ) {
	const [ chartLoaded, setChartLoaded ] = useState( false );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} ) );

	const args = {
		...dateRangeDates,
		metrics: [ { expression: 'ga:users' } ],
		dimensions: [ dimensionName ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	};

	if ( entityURL ) {
		args.url = entityURL;
	}

	const loaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( STORE_NAME ).getReport( args ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const onReady = useCallback( () => {
		setChartLoaded( true );

		const chartData = GoogleChart.charts.get( 'user-dimensions-pie-chart' );
		const { chart, onSelect } = chartData || {};
		const { slices } = UserDimensionsPieChart.chartOptions;

		if ( chart && ! onSelect ) {
			chartData.onSelect = global.google.visualization.events.addListener( chart, 'select', () => {
				const { row } = chart.getSelection()?.[ 0 ] || {};
				if ( row !== null && row !== undefined ) {
					const { dataTable } = GoogleChart.charts.get( 'user-dimensions-pie-chart' ) || {};
					if ( dataTable ) {
						const dimensionValue = dataTable.getValue( row, 0 );

						setValues(
							FORM_ALL_TRAFFIC_WIDGET,
							{
								dimensionValue: __( 'Others', 'google-site-kit' ) === dimensionValue ? '' : dimensionValue,
								dimensionColor: slices[ row ]?.color,
							}
						);
					}
				} else {
					setValues( FORM_ALL_TRAFFIC_WIDGET, { dimensionValue: '', dimensionColor: '' } );
				}
			} );
		}
	}, [ dimensionName, setValues ] );

	if ( ! loaded ) {
		return <PreviewBlock width="282px" height="282px" shape="circular" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( report ) ) {
		return <ReportZero moduleSlug="analytics" />;
	}

	const absOthers = {
		current: report[ 0 ].data.totals[ 0 ].values[ 0 ],
		previous: report[ 0 ].data.totals[ 1 ].values[ 0 ],
	};

	report[ 0 ].data.rows.forEach( ( { metrics } ) => {
		absOthers.current -= metrics[ 0 ].values[ 0 ];
		absOthers.previous -= metrics[ 1 ].values[ 0 ];
	} );

	const dataMap = extractAnalyticsDataForPieChart( report, {
		keyColumnIndex: 0,
		maxSlices: 5,
		withOthers: true,
		tooltipCallback: ( row, rowData ) => {
			let difference = row?.metrics?.[ 1 ]?.values?.[ 0 ] > 0
				? ( row.metrics[ 0 ].values[ 0 ] * 100 / row.metrics[ 1 ].values[ 0 ] ) - 100
				: 100;

			if ( row === null && absOthers.previous > 0 ) {
				difference = ( absOthers.current * 100 / absOthers.previous ) - 100;
			}

			const absValue = row ? row.metrics[ 0 ].values[ 0 ] : absOthers.current;
			const statInfo = sprintf(
				/* translators: 1: numeric value of users, 2: up or down arrow , 3: different change in percentage, %%: percent symbol */
				_x( 'Users: <strong>%1$s</strong> <em>%2$s %3$s%%</em>', 'Stat information for the user dimensions chart tooltip', 'google-site-kit' ),
				numberFormat( absValue ),
				`<svg width="9" height="9" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" class="${ classnames( 'googlesitekit-change-arrow', {
					'googlesitekit-change-arrow--up': difference > 0,
					'googlesitekit-change-arrow--down': difference < 0,
				} ) }">
					<path d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z" fill="currentColor" />
				</svg>`,
				numberFormat( Math.abs( difference ), { maximumFractionDigits: 2 } ),
			);

			const dimensionClassName = `googlesitekit-visualization-tooltip-${ rowData[ 0 ].toLowerCase().replace( /\W+/, '_' ) }`;

			let tooltip = (
				`<p>
					${ /* translators: %s: dimension label */ sprintf( __( '%s:', 'google-site-kit' ), rowData[ 0 ].toUpperCase() ) }
					<b>${ numberFormat( rowData[ 1 ], { maximumFractionDigits: 1, style: 'percent' } ) }</b>
				</p>
				<p>
					${ statInfo }
				</p>`
			);

			if ( sourceLink && rowData[ 0 ].toLowerCase() === 'others' ) {
				tooltip += (
					`<p>
						<a class="googlesitekit-cta-link googlesitekit-cta-link--external googlesitekit-cta-link--inherit" href="${ sourceLink }" target="_blank" rel="noreferrer noopener">
							${ __( 'See the detailed breakdown in Analytics', 'google-site-kit' ) }
						</a>
					</p>`
				);
			}

			tooltip = (
				`<div class="${ classnames( 'googlesitekit-visualization-tooltip', dimensionClassName, {
					'googlesitekit-visualization-tooltip--up': difference > 0,
					'googlesitekit-visualization-tooltip--down': difference < 0,
				} ) }">
					${ tooltip }
				</div>`
			);

			return tooltip;
		},
	} );

	const labels = {
		'ga:channelGrouping': __( '<span>By</span> channels', 'google-site-kit' ),
		'ga:country': __( '<span>By</span> locations', 'google-site-kit' ),
		'ga:deviceCategory': __( '<span>By</span> devices', 'google-site-kit' ),
	};

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'span' ],
		ALLOWED_ATTR: [],
	};

	const title = chartLoaded
		? sanitizeHTML( labels[ dimensionName ] || '', sanitizeArgs )
		: { __html: '' };

	const options = { ...UserDimensionsPieChart.chartOptions };
	if ( report[ 0 ].data.rows.length < 2 ) {
		// Hide pie slice text when there is just one slice because it will overlap with the chart title.
		options.pieSliceTextStyle.color = 'transparent';
	}

	return (
		<div className="googlesitekit-widget--analyticsAllTrafficV2__dimensions-chart">
			<GoogleChart
				chartID="user-dimensions-pie-chart"
				chartType="pie"
				options={ options }
				data={ dataMap }
				loadHeight={ 205 }
				onReady={ onReady }
			/>
			<div
				className="googlesitekit-widget--analyticsAllTrafficV2__dimensions-chart-title"
				dangerouslySetInnerHTML={ title }
			/>
		</div>
	);
}

UserDimensionsPieChart.propTypes = {
	sourceLink: PropTypes.string,
	dimensionName: PropTypes.string.isRequired,
	entityURL: PropTypes.string,
};

UserDimensionsPieChart.defaultProps = {
	dimensionName: 'ga:channelGrouping',
};

UserDimensionsPieChart.chartOptions = {
	chartArea: {
		left: 0,
		height: 300,
		top: 50,
		width: '100%',
	},
	backgroundColor: 'transparent',
	fontName: 'Roboto',
	fontSize: 12,
	height: 410,
	legend: {
		alignment: 'center',
		position: 'bottom',
		textStyle: {
			color: 'black',
			fontSize: 12,
		},
	},
	pieHole: 0.6,
	pieSliceTextStyle: {
		color: 'black',
		fontName: 'Roboto',
		fontSize: 12,
	},
	slices: {
		0: { color: '#ffcd33' },
		1: { color: '#c196ff' },
		2: { color: '#9de3fe' },
		3: { color: '#ff7fc6' },
		4: { color: '#ff886b' },
	},
	title: null,
	tooltip: {
		isHtml: true, // eslint-disable-line sitekit/camelcase-acronyms
		trigger: 'both',
	},
	width: '100%',
};
