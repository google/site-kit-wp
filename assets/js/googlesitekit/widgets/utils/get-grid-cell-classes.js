/**
 * Widgets: Grid Cell Layout utility functions.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { WIDTH_GRID_MAP, WIDGET_WIDTHS } from '../datastore/constants';

/**
 * Returns an array of `classNames` to assign to a Widget wrapper.
 *
 * @since n.e.x.t
 *
 * @param {Array} widgets An array of `Widget` objects, usually from the `getWidgets()` selector.
 * @return {Array} Array of classNames to apply to an element.
 */
export const getGridCellClasses = ( widgets ) => {
	let counter = 0;
	const classNamesMap = [];

	widgets.forEach( ( widget, i ) => {
		const WidgetComponent = widget.component;
		const widgetOutput = <WidgetComponent />;

		// If this widget output `null`, there's no sense in outputting classes for it.
		if ( widgetOutput === null ) {
			return null;
		}

		const classNames = [ 'mdc-layout-grid__cell' ];

		if ( widget.width === WIDGET_WIDTHS.FULL ) {
			classNames.push(
				'mdc-layout-grid__cell--span-12',
			);
		}

		if ( widget.width === WIDGET_WIDTHS.HALF ) {
			classNames.push(
				'mdc-layout-grid__cell--span-6-desktop',
				'mdc-layout-grid__cell--span-8-tablet',
			);
		}

		if ( widget.width === WIDGET_WIDTHS.QUARTER ) {
			classNames.push(
				'mdc-layout-grid__cell--span-3-desktop',
				'mdc-layout-grid__cell--span-4-tablet',
			);
		}

		counter += WIDTH_GRID_MAP[ widget.width ];

		if ( counter % 12 === 0 ) {
			counter = 0;
		}

		if ( counter > 12 ) {
			counter -= WIDTH_GRID_MAP[ widget.width ];

			if ( counter === 9 ) {
				let previousIndexOffset = 1;
				while ( counter !== 0 ) {
					if ( classNamesMap[ i - previousIndexOffset ].includes( 'mdc-layout-grid__cell--span-3-desktop' ) ) {
						// Replace the 3-column class with a 4-column class so this element goes from 1/4
						// to 1/3 on desktop.
						classNamesMap[ i - previousIndexOffset ][ classNamesMap[ i - previousIndexOffset ].indexOf( 'mdc-layout-grid__cell--span-3-desktop' ) ] = 'mdc-layout-grid__cell--span-4-desktop';

						counter -= 3;
					}

					if ( classNamesMap[ i - previousIndexOffset ].includes( 'mdc-layout-grid__cell--span-6-desktop' ) ) {
					// Replace the 6-column class with a 8-column class so this element goes from 1/2
					// to 2/3 on desktop.
						classNamesMap[ i - previousIndexOffset ][ classNamesMap[ i - previousIndexOffset ].indexOf( 'mdc-layout-grid__cell--span-6-desktop' ) ] = 'mdc-layout-grid__cell--span-8-desktop';

						counter -= 6;
					}

					previousIndexOffset += 1;
				}
			}

			counter = WIDTH_GRID_MAP[ widget.width ];
		}

		if ( counter === 9 ) {
			let previousIndexOffset = 1;
			while ( counter !== 0 ) {
				if ( classNamesMap[ i - previousIndexOffset ].includes( 'mdc-layout-grid__cell--span-3-desktop' ) ) {
					// Replace the 3-column class with a 4-column class so this element goes from 1/4
					// to 1/3 on desktop.
					classNamesMap[ i - previousIndexOffset ][ classNamesMap[ i - previousIndexOffset ].indexOf( 'mdc-layout-grid__cell--span-3-desktop' ) ] = 'mdc-layout-grid__cell--span-4-desktop';

					counter -= 3;
				}

				if ( classNamesMap[ i - previousIndexOffset ].includes( 'mdc-layout-grid__cell--span-6-desktop' ) ) {
					// Replace the 6-column class with a 8-column class so this element goes from 1/2
					// to 2/3 on desktop.
					classNamesMap[ i - previousIndexOffset ][ classNamesMap[ i - previousIndexOffset ].indexOf( 'mdc-layout-grid__cell--span-6-desktop' ) ] = 'mdc-layout-grid__cell--span-8-desktop';

					counter -= 6;
				}

				previousIndexOffset += 1;
			}
		}

		classNamesMap[ i ] = classNames;
	} );

	return classNamesMap;
};
