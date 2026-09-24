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
 * The space for the value labels beside the chart area, in font sizes. It has
 * room for the widest label, such as `400M`, `12.5K`, or `0.125`, when the
 * highest value is 0.1 or more.
 */
const VALUE_AXIS_GUTTER = 3.2;

/**
 * The width one more digit adds to a value label, in font sizes. It's a little
 * more than the widest digit, `0`.
 */
const EXTRA_DIGIT_WIDTH = 0.7;

/**
 * The space a date label takes, in font sizes: the widest date, `May 30`, plus
 * the gap Google Charts keeps between two labels.
 */
const DATE_LABEL_SPACE = 4.4;

/**
 * The width of each month's short name, from `Jan` to `Dec`, in font sizes, in
 * Google Sans Text.
 */
const MONTH_WIDTHS = [
	1.653, 1.687, 1.763, 1.611, 1.885, 1.666, 1.33, 1.771, 1.753, 1.665, 1.755,
	1.796,
];

/**
 * The width of each digit, from `0` to `9`, in font sizes, in Google Sans Text.
 */
const DIGIT_WIDTHS = [
	0.668, 0.42, 0.528, 0.537, 0.577, 0.556, 0.564, 0.513, 0.546, 0.564,
];

/** The width of the space between the month and the day, in font sizes. */
const SPACE_WIDTH = 0.256;

/**
 * The date label format, such as `Sep 23`. The report loads Google Charts in
 * English, so every site shows English dates.
 */
const DATE_LABEL_FORMAT = new Intl.DateTimeFormat( 'en-US', {
	month: 'short',
	day: 'numeric',
} );

export interface DateTick {
	/** Where the middle of the label sits. */
	v: Date;
	/** The label, such as `Sep 23`. */
	f: string;
}

/**
 * Gets the number format for the value labels.
 *
 * The `short` format writes 58,000 as `58K`. But it also writes `0.025` as
 * `0.03`. From 100 up, every gridline is a whole number, so no label loses a
 * digit.
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
 * Gets the width the value labels need beside the chart area, in chart pixels.
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
	// Each zero between the decimal point and the first digit, such as the two
	// in `0.004`, adds a digit to the labels.
	const zerosAfterPoint =
		maxValue > 0 && maxValue < 1
			? -1 - Math.floor( Math.log10( maxValue ) )
			: 0;

	return Math.ceil(
		( VALUE_AXIS_GUTTER + zerosAfterPoint * EXTRA_DIGIT_WIDTH ) * fontSize
	);
}

/**
 * Gets the width of a date's label, in chart pixels.
 *
 * @since n.e.x.t
 *
 * @param {Date}   date     The date.
 * @param {number} fontSize The label font size, in chart pixels.
 * @return {number} The label width, in chart pixels.
 */
function getDateLabelWidth( date: Date, fontSize: number ): number {
	const dayWidth = String( date.getDate() )
		.split( '' )
		.reduce(
			( width, digit ) => width + DIGIT_WIDTHS[ Number( digit ) ],
			0
		);

	return (
		( MONTH_WIDTHS[ date.getMonth() ] + SPACE_WIDTH + dayWidth ) * fontSize
	);
}

/**
 * Gets the date labels for the horizontal axis.
 *
 * The first and last labels sit flush with the chart area's edges, as in the
 * Figma design. Google Charts puts the middle of a label on its tick, so these
 * two ticks move in by half the label's width.
 *
 * The labels between fall every few dates. Where they can, they split the dates
 * into equal parts. No two labels sit closer than a label's space.
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
	function toTick( date: Date ) {
		return {
			v: date,
			f: DATE_LABEL_FORMAT.format( date ),
		};
	}

	if ( dates.length < 2 ) {
		return dates.map( toTick );
	}

	const lastIndex = dates.length - 1;
	const startTime = dates[ 0 ].getTime();
	const msPerPixel =
		( dates[ lastIndex ].getTime() - startTime ) / chartAreaWidth;
	function getCenter( index: number ) {
		return ( dates[ index ].getTime() - startTime ) / msPerPixel;
	}

	const labelSpace = DATE_LABEL_SPACE * fontSize;
	const firstCenter = getDateLabelWidth( dates[ 0 ], fontSize ) / 2;
	const lastCenter =
		chartAreaWidth - getDateLabelWidth( dates[ lastIndex ], fontSize ) / 2;
	function hasRoom( index: number ) {
		return (
			getCenter( index ) - firstCenter >= labelSpace &&
			lastCenter - getCenter( index ) >= labelSpace
		);
	}
	const minStep = Math.ceil( ( labelSpace * lastIndex ) / chartAreaWidth );

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
			const lowest = indexesWithRoom[ 0 ];
			const highest = indexesWithRoom[ indexesWithRoom.length - 1 ];
			const runLength =
				Math.floor( ( highest - lowest ) / minStep ) * minStep;
			const middleIndex =
				( ( firstCenter + lastCenter ) / 2 / chartAreaWidth ) *
				lastIndex;
			const runStart = Math.min(
				Math.max( Math.round( middleIndex - runLength / 2 ), lowest ),
				highest - runLength
			);

			middleIndexes = Array.from(
				{ length: runLength / minStep + 1 },
				( _value, position ) => runStart + position * minStep
			);
		}
	}

	// A chart with missing dates can put two labels too close together, so a
	// label stays only when it has a label's space from the one before it.
	const labeledIndexes: number[] = [];
	middleIndexes.forEach( ( index ) => {
		const previousCenter = labeledIndexes.length
			? getCenter( labeledIndexes[ labeledIndexes.length - 1 ] )
			: firstCenter;

		if ( getCenter( index ) - previousCenter >= labelSpace ) {
			labeledIndexes.push( index );
		}
	} );

	function labelAt( date: Date, center: number ) {
		return {
			// This date is a point on the axis, not today's date, so the reference
			// date doesn't apply.
			// eslint-disable-next-line sitekit/no-direct-date
			v: new Date( startTime + center * msPerPixel ),
			f: DATE_LABEL_FORMAT.format( date ),
		};
	}

	return [
		labelAt( dates[ 0 ], firstCenter ),
		...labeledIndexes.map( ( index ) => toTick( dates[ index ] ) ),
		labelAt( dates[ lastIndex ], lastCenter ),
	];
}
