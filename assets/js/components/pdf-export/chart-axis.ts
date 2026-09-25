/**
 * Chart axis helpers for the PDF report.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import {
	GoogleVisualizationFormatter,
	getVisualization,
} from './render-google-chart-to-data-uri';

export interface DateTick {
	/** Google Charts reads a tick's value from `v`, the point on the axis that lines up with the middle of the tick's label. */
	v: Date;
	/** Google Charts reads a tick's label from `f`, such as `Sep 23`. */
	f: string;
}

/**
 * Gets the Google Charts formatter for a pattern. The formatter writes a value
 * as the chart writes its labels, in the language Google Charts loaded with.
 *
 * @since n.e.x.t
 *
 * @param {string} type    The formatter, `DateFormat` or `NumberFormat`.
 * @param {string} pattern The pattern, such as `MMM d` or `short`.
 * @return {Object} A formatter with a `formatValue()` method.
 */
function getChartLabelFormatter(
	type: 'DateFormat' | 'NumberFormat',
	pattern: string
): GoogleVisualizationFormatter {
	const Formatter = getVisualization()?.[ type ];

	if ( ! Formatter ) {
		throw new Error(
			`Site Kit: Google Charts ${ type } is missing after the library loaded.`
		);
	}

	return new Formatter( { pattern } );
}

/**
 * Gets the width of each label in Google Sans Text, the font the charts write
 * their labels in.
 *
 * @since n.e.x.t
 *
 * @param {string[]} labels   The labels.
 * @param {number}   fontSize The label font size, in chart pixels.
 * @return {number[]} The label widths, in chart pixels, in order.
 */
function getLabelWidths( labels: string[], fontSize: number ): number[] {
	const context = global.document
		.createElement( 'canvas' )
		.getContext( '2d' );

	if ( ! context ) {
		throw new Error(
			'Site Kit: could not get a 2D canvas context to measure the chart labels.'
		);
	}

	context.font = `${ fontSize }px "Google Sans Text"`;

	return labels.map( ( label ) => context.measureText( label ).width );
}

/**
 * Gets the labels the value axis can show in the `short` format.
 *
 * Google Charts puts a gridline on each multiple of a step, up to the first
 * multiple above the highest value. The step is 1, 1.5, 2, 2.5, or 5 times a
 * power of 10. A step that needs more than 20 labels is left out, because the
 * chart has no room for them.
 *
 * @since n.e.x.t
 *
 * @param {number} maxValue The highest value on the chart, 100 or more.
 * @return {string[]} The labels.
 */
function getShortValueLabels( maxValue: number ): string[] {
	const shortFormat = getChartLabelFormatter( 'NumberFormat', 'short' );
	const largestPowerOfTen = 10 ** Math.floor( Math.log10( maxValue ) );

	return [
		largestPowerOfTen / 100,
		largestPowerOfTen / 10,
		largestPowerOfTen,
	]
		.flatMap( ( powerOfTen ) =>
			[ 1, 1.5, 2, 2.5, 5 ].map(
				( multiplier ) => multiplier * powerOfTen
			)
		)
		.filter( ( step ) => maxValue / step <= 20 )
		.flatMap( ( step ) =>
			Array.from(
				{ length: Math.floor( maxValue / step ) + 1 },
				( _value, index ) =>
					shortFormat.formatValue( ( index + 1 ) * step )
			)
		);
}

/**
 * Gets the number format for the value labels.
 *
 * The `short` format writes 58,000 as `58K`. But it also writes 0.025 as
 * `0.03`. When the highest value is 100 or more, every gridline is a whole
 * number, so no label loses a digit.
 *
 * @since n.e.x.t
 *
 * @param {number} maxValue The highest value on the chart.
 * @return {string|undefined} `short`, or `undefined` for Google Charts' default format.
 */
export function getValueAxisFormat( maxValue: number ): 'short' | undefined {
	return maxValue >= 100 ? 'short' : undefined;
}

/**
 * Gets the gutter, the space beside the chart area where the value labels go,
 * in chart pixels.
 *
 * Google Charts cuts off a value label that is wider than the gutter, and ends
 * it with an ellipsis.
 *
 * @since n.e.x.t
 *
 * @param {number} maxValue The highest value on the chart.
 * @param {number} fontSize The label font size, in chart pixels.
 * @return {number} The gutter width, in chart pixels.
 */
export function getValueAxisGutter(
	maxValue: number,
	fontSize: number
): number {
	// A gutter 3.2 times the font size has room for the widest English label,
	// such as `400M`, `12.5K`, or `0.125`, when the highest value is 0.1 or more.
	// Each zero right after the decimal point, such as the two in `0.004`, makes
	// the labels one digit longer. The gutter grows by 0.7 times the font size
	// for each one.
	const zerosAfterPoint =
		maxValue > 0 && maxValue < 1
			? -1 - Math.floor( Math.log10( maxValue ) )
			: 0;
	const gutter = ( 3.2 + zerosAfterPoint * 0.7 ) * fontSize;

	if ( getValueAxisFormat( maxValue ) !== 'short' ) {
		return Math.ceil( gutter );
	}

	// In some languages the `short` format writes thousands in full, such as
	// `400.000` in German, so the gutter grows to make room for the widest label
	// the axis can show.
	const widestLabelWidth = Math.max(
		...getLabelWidths( getShortValueLabels( maxValue ), fontSize )
	);

	// A value label starts 0.45 times the font size from the chart area.
	return Math.ceil( Math.max( gutter, widestLabelWidth + 0.45 * fontSize ) );
}

/**
 * Gets the date labels for the horizontal axis.
 *
 * Each label uses the pattern of the dashboard's charts, such as `Sep 23`, in
 * the language Google Charts loaded with. The first label starts at the chart
 * area's left edge, and the last label ends at its right edge, as in the Figma
 * design. Google Charts puts the middle of a label on its tick, so these two
 * ticks move in by half the label's width.
 *
 * Between them, every few dates get a label. Where they can, the labels split
 * the dates into equal parts. No two labels are closer than the widest date
 * label plus the gap Google Charts needs between them.
 *
 * @since n.e.x.t
 *
 * @param {Date[]} dates          The dates on the chart, in order.
 * @param {number} chartAreaWidth The width of the chart area, in chart pixels.
 * @param {number} fontSize       The date label font size, in chart pixels.
 * @return {DateTick[]} The date labels, in order.
 */
export function pickDateTicks(
	dates: Date[],
	chartAreaWidth: number,
	fontSize: number
): DateTick[] {
	const dateFormat = getChartLabelFormatter( 'DateFormat', 'MMM d' );
	function toLabel( date: Date ) {
		return dateFormat.formatValue( date );
	}
	function toTick( date: Date ) {
		return {
			v: date,
			f: toLabel( date ),
		};
	}

	if ( dates.length < 2 ) {
		return dates.map( toTick );
	}

	const lastIndex = dates.length - 1;
	const startTime = dates[ 0 ].getTime();
	const millisecondsPerPixel =
		( dates[ lastIndex ].getTime() - startTime ) / chartAreaWidth;
	function getCenter( index: number ) {
		return ( dates[ index ].getTime() - startTime ) / millisecondsPerPixel;
	}

	// Every day of a leap year, so `labelDistance` has room for the widest label
	// any date can have.
	const everyDayLabels = Array.from( { length: 366 }, ( _day, index ) =>
		toLabel( new Date( 2024, 0, 1 + index ) )
	);
	// Google Charts needs a gap 1.05 times the font size between two date
	// labels.
	const labelDistance =
		Math.max( ...getLabelWidths( everyDayLabels, fontSize ) ) +
		1.05 * fontSize;
	const [ firstLabelWidth, lastLabelWidth ] = getLabelWidths(
		[ toLabel( dates[ 0 ] ), toLabel( dates[ lastIndex ] ) ],
		fontSize
	);
	const firstCenter = firstLabelWidth / 2;
	const lastCenter = chartAreaWidth - lastLabelWidth / 2;
	function hasRoom( index: number ) {
		return (
			getCenter( index ) - firstCenter >= labelDistance &&
			lastCenter - getCenter( index ) >= labelDistance
		);
	}
	const minStep = Math.ceil( ( labelDistance * lastIndex ) / chartAreaWidth );

	// Find the smallest step that splits the dates into equal parts and leaves
	// room beside the first and last labels.
	const evenStep = Array.from(
		{ length: Math.floor( lastIndex / 2 ) - minStep + 1 },
		( _value, offset ) => minStep + offset
	).find(
		( step ) =>
			lastIndex % step === 0 &&
			hasRoom( step ) &&
			hasRoom( lastIndex - step )
	);

	let middleIndexes: number[] = [];
	if ( evenStep ) {
		middleIndexes = Array.from(
			{ length: lastIndex / evenStep - 1 },
			( _value, position ) => ( position + 1 ) * evenStep
		);
	} else {
		// No step splits the dates into equal parts, so put a run of labels, one
		// every `minStep` dates, in the middle between the first and last labels.
		const indexesWithRoom = dates
			.map( ( _date, index ) => index )
			.filter( hasRoom );

		if ( indexesWithRoom.length ) {
			const firstIndexWithRoom = indexesWithRoom[ 0 ];
			const lastIndexWithRoom =
				indexesWithRoom[ indexesWithRoom.length - 1 ];
			const runLength =
				Math.floor(
					( lastIndexWithRoom - firstIndexWithRoom ) / minStep
				) * minStep;
			const midpointIndex =
				( ( firstCenter + lastCenter ) / 2 / chartAreaWidth ) *
				lastIndex;
			const runStart = Math.min(
				Math.max(
					Math.round( midpointIndex - runLength / 2 ),
					firstIndexWithRoom
				),
				lastIndexWithRoom - runLength
			);

			middleIndexes = Array.from(
				{ length: runLength / minStep + 1 },
				( _value, position ) => runStart + position * minStep
			);
		}
	}

	// Missing dates can put two labels too close together, so skip a label that
	// is closer than `labelDistance` to the one before it.
	const labeledIndexes: number[] = [];
	middleIndexes.forEach( ( index ) => {
		const previousCenter = labeledIndexes.length
			? getCenter( labeledIndexes[ labeledIndexes.length - 1 ] )
			: firstCenter;

		if ( getCenter( index ) - previousCenter >= labelDistance ) {
			labeledIndexes.push( index );
		}
	} );

	function tickAt( date: Date, center: number ) {
		return {
			// This date is a point on the axis, not today's date, so the reference
			// date doesn't apply.
			// eslint-disable-next-line sitekit/no-direct-date
			v: new Date( startTime + center * millisecondsPerPixel ),
			f: toLabel( date ),
		};
	}

	return [
		tickAt( dates[ 0 ], firstCenter ),
		...labeledIndexes.map( ( index ) => toTick( dates[ index ] ) ),
		tickAt( dates[ lastIndex ], lastCenter ),
	];
}
