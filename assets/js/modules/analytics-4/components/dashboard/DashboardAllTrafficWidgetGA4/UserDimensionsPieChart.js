import classnames from 'classnames';
import { __ } from '@wordpress/i18n';
import { cloneDeep } from 'lodash';

import { useLabelColorMap } from './useLabelColorMap';
import GoogleChart from '../../../../../components/GoogleChart';
import Link from '../../../../../components/Link';
import { extractAnalyticsDataForPieChart } from '../../../utils';

export default function UserDimensionsPieChart( {
	report,
	dimensionValue,
	loaded,
	gatheringData,
	onLegendClick,
	showZeroDataChart,
} ) {
	const getColorForLabel = useLabelColorMap();

	const dataMap = extractAnalyticsDataForPieChart( report, {
		keyColumnIndex: 0,
		maxSlices: 5,
		withOthers: true,
	} );

	const options = cloneDeep( UserDimensionsPieChart.chartOptions );
	const slices = {};

	dataMap.slice( 1 ).forEach( ( [ label ], index ) => {
		slices[ index ] = { color: getColorForLabel( label ) };
	} );

	options.slices = slices;

	const labelMetaMap = dataMap
		.slice( 1 )
		.map( ( [ label ], i ) => {
			const value = Number(
				report?.rows?.[ i ]?.metricValues?.[ 0 ]?.value || 0
			);
			return {
				label,
				color: slices[ i ]?.color || '#ccc',
				index: i,
				value,
			};
		} )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className="googlesitekit-widget--analyticsAllTraffic__dimensions-chart">
			<GoogleChart
				chartType="PieChart"
				data={ dataMap }
				options={ options }
				height="368px"
			/>

			{ loaded &&
				! showZeroDataChart &&
				labelMetaMap.map( ( { label, color, index } ) => {
					const isActive = label === dimensionValue;
					const isOthers =
						__( 'Others', 'google-site-kit' ) === label;

					return (
						<Link
							key={ label }
							onClick={ () => onLegendClick( index ) }
							className={ classnames(
								'googlesitekit-widget--analyticsAllTraffic__legend-slice',
								{
									'googlesitekit-widget--analyticsAllTraffic__legend-active':
										isActive,
									'googlesitekit-widget--analyticsAllTraffic__legend-others':
										isOthers,
								}
							) }
							disabled={ gatheringData }
						>
							<span
								className="googlesitekit-widget--analyticsAllTraffic__dot"
								style={ { backgroundColor: color } }
							/>

							<span
								className="googlesitekit-widget--analyticsAllTraffic__label"
								data-label={ label }
							>
								{ label }
							</span>

							<span
								className="googlesitekit-widget--analyticsAllTraffic__underlay"
								style={ { backgroundColor: color } }
							/>
						</Link>
					);
				} ) }
		</div>
	);
}

UserDimensionsPieChart.chartOptions = {
	chartArea: {
		left: 'auto',
		height: 300,
		top: 'auto',
		width: '100%',
	},
	backgroundColor: 'transparent',
	fontSize: 12,
	height: 368,
	legend: { position: 'none' },
	pieHole: 0.6,
	pieSliceTextStyle: {
		color: '#131418',
		fontSize: 12,
	},
	title: null,
	tooltip: {
		isHtml: true, // eslint-disable-line sitekit/acronym-case
		trigger: 'focus',
	},
	width: '100%',
};
