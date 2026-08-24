/**
 * Chart axis label helpers for the PDF report.
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
 * The width of one label character, as a share of the font size.
 *
 * The report draws its charts in a hidden container, where the browser can't
 * measure the drawn text, so the helpers below count characters instead. In
 * Google Sans Text a digit takes 0.556 of the font size and a magnitude letter
 * takes a little more, so this share never gives a width that is too small.
 */
const LABEL_CHARACTER_WIDTH_RATIO = 0.6;

/**
 * Shortens a value the way the charts' `short` number format draws it.
 *
 * A value of a thousand or more takes the letter of its magnitude, so 58000
 * becomes `58K`. A smaller value keeps its plain number, down to two
 * significant digits, so 900 stays `900`. The chart draws the decimal places
 * its gridline step needs, and two significant digits covers them.
 *
 * `getValueAxisGutter` measures the labels with this, so the width it reserves
 * matches the text the chart draws.
 *
 * @since n.e.x.t
 *
 * @param {number} value The value to shorten.
 * @return {string} The shortened value.
 */
export function formatShortValue( value: number ): string {
	const magnitude = [
		{ limit: 1e12, suffix: 'T' },
		{ limit: 1e9, suffix: 'B' },
		{ limit: 1e6, suffix: 'M' },
		{ limit: 1e3, suffix: 'K' },
	].find( ( { limit } ) => Math.abs( value ) >= limit );

	if ( ! magnitude ) {
		if ( value === 0 ) {
			return '0';
		}

		// A value below one needs a decimal place for every leading zero after
		// the point, and two more for its two significant digits.
		const places = Math.max(
			0,
			1 - Math.floor( Math.log10( Math.abs( value ) ) )
		);
		const text = value.toFixed( places );

		return places > 0 ? text.replace( /\.?0+$/, '' ) : text;
	}

	const scaled = value / magnitude.limit;
	const rounded =
		Math.abs( scaled ) < 10
			? Math.round( scaled * 10 ) / 10
			: Math.round( scaled );

	return `${ rounded }${ magnitude.suffix }`;
}

/**
 * Measures the width the value axis labels need, in chart pixels.
 *
 * The charts draw the value labels in the space `chartArea.right` keeps free to
 * the right of the plot. When that space is too narrow the chart cuts a label
 * off with an ellipsis, so this returns the width the widest label needs, plus
 * half a character between the plot and the label.
 *
 * @since n.e.x.t
 *
 * @param {number} maxValue The highest value the axis reaches.
 * @param {number} fontSize The label font size, in chart pixels.
 * @return {number} The width to keep free, in chart pixels.
 */
export function getValueAxisGutter(
	maxValue: number,
	fontSize: number
): number {
	// The chart picks its own gridlines, so the labels it draws are unknown
	// here. A quarter of the maximum needs a decimal place more often than a
	// round gridline value does, so the widest of these four is never narrower
	// than the widest label the chart draws.
	const widestLabelCharacters = [ 1, 0.75, 0.5, 0.25 ].reduce(
		( mostCharacters, share ) =>
			Math.max(
				mostCharacters,
				formatShortValue( maxValue * share ).length
			),
		1
	);

	return Math.ceil(
		( widestLabelCharacters + 0.5 ) * fontSize * LABEL_CHARACTER_WIDTH_RATIO
	);
}

/**
 * Picks the dates the horizontal axis draws as ticks.
 *
 * The chart centers each label on its own date, so a label near either end of
 * the range runs past the plot. On the left the chart cuts it off. On the
 * right it runs into the value labels and sits on top of the zero.
 *
 * The ticks start and end far enough in for a whole label to fit. Between
 * those two, every Nth date stays, so the labels fit `plotWidth` on one line.
 *
 * The longer the range, the closer together the dates sit, so a 90 day range
 * skips more dates at each end than a 28 day one.
 *
 * @since n.e.x.t
 *
 * @param {Date[]} dates     Every date in the range, in order.
 * @param {number} plotWidth The width the labels have, in chart pixels.
 * @param {number} fontSize  The label font size, in chart pixels.
 * @return {Date[]} The dates to draw as ticks.
 */
export function pickDateTicks(
	dates: Date[],
	plotWidth: number,
	fontSize: number
): Date[] {
	if ( dates.length < 3 ) {
		return [];
	}

	// The charts draw a date in the `MMM d` format, so a label is at most six
	// characters, such as `Sep 30`. One more character keeps two labels apart.
	const labelWidth = 7 * fontSize * LABEL_CHARACTER_WIDTH_RATIO;
	const pixelsPerDate = plotWidth / ( dates.length - 1 );

	// A very narrow plot pushes the inset past the middle of the range, so
	// hold it back far enough to leave two dates to draw.
	const widestInset = Math.max( 1, Math.floor( ( dates.length - 2 ) / 2 ) );
	const inset = Math.min(
		widestInset,
		Math.ceil( labelWidth / 2 / pixelsPerDate )
	);
	const innerDates = dates.slice( inset, dates.length - inset );

	if ( innerDates.length < 2 ) {
		return innerDates;
	}

	const labelsThatFit = Math.max( 2, Math.floor( plotWidth / labelWidth ) );
	const step = Math.ceil( innerDates.length / labelsThatFit );

	return innerDates.filter( ( _, index ) => index % step === 0 );
}
