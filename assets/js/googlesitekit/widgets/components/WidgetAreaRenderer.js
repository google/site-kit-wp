/**
 * WidgetAreaRenderer component.
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
 * External dependencies
 */
import classnames from 'classnames';
import { string } from 'prop-types';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, WIDTH_GRID_MAP, WIDGET_WIDTHS } from '../datastore/constants';
import WidgetRenderer from './WidgetRenderer';

const { useSelect } = Data;

const resizeClasses = ( classNames, counter ) => {
	[ ...classNames ].reverse().some( ( _classNames, index ) => {
		const originalIndex = classNames.length - 1 - index;

		// Skip any classNames that are `null`; this happens when the component itself
		// renders `null`.
		if ( ! _classNames || ! Array.isArray( _classNames ) ) {
			return false;
		}

		if ( _classNames.includes( 'mdc-layout-grid__cell--span-3-desktop' ) ) {
			// Replace the 3-column class with a 4-column class so this element goes from 1/4
			// to 1/3 on desktop.
			classNames[ originalIndex ][ _classNames.indexOf( 'mdc-layout-grid__cell--span-3-desktop' ) ] = 'mdc-layout-grid__cell--span-4-desktop';

			counter -= 3;
		}

		if ( _classNames.includes( 'mdc-layout-grid__cell--span-6-desktop' ) ) {
			// Replace the 6-column class with a 8-column class so this element goes from 1/2
			// to 2/3 on desktop.
			classNames[ originalIndex ][ _classNames.indexOf( 'mdc-layout-grid__cell--span-6-desktop' ) ] = 'mdc-layout-grid__cell--span-8-desktop';

			counter -= 6;
		}

		return counter === 0;
	} );

	return [ classNames, counter ];
};

const WidgetAreaRenderer = ( { slug } ) => {
	const widgetArea = useSelect( ( select ) => select( STORE_NAME ).getWidgetArea( slug ) );
	const widgets = useSelect( ( select ) => select( STORE_NAME ).getWidgets( slug ) );

	// State handled by WidgetRenderer instances, based on whether the widget
	// renders content or `null`.
	const [ activeWidgets, setActiveWidgets ] = useState( {} );

	const widgetClassNames = useMemo( () => {
		let classNames = [];
		let counter = 0;
		widgets.forEach( ( widget, i ) => {
			// If this widget is not active (outputs `null`), there's no sense in outputting classes for it.
			if ( ! activeWidgets[ widget.slug ] ) {
				classNames[ i ] = null;
				return;
			}

			const width = widget.width;
			const classNamesForWidget = [ 'mdc-layout-grid__cell' ];

			if ( width === WIDGET_WIDTHS.FULL ) {
				classNamesForWidget.push(
					'mdc-layout-grid__cell--span-12',
				);
			}

			if ( width === WIDGET_WIDTHS.HALF ) {
				classNamesForWidget.push(
					'mdc-layout-grid__cell--span-6-desktop',
					'mdc-layout-grid__cell--span-8-tablet',
				);
			}

			if ( width === WIDGET_WIDTHS.QUARTER ) {
				classNamesForWidget.push(
					'mdc-layout-grid__cell--span-3-desktop',
					'mdc-layout-grid__cell--span-4-tablet',
				);
			}

			classNames[ i ] = classNamesForWidget;

			counter += WIDTH_GRID_MAP[ width ];

			if ( counter % 12 === 0 ) {
				counter = 0;
			}

			if ( counter > 12 ) {
				counter -= WIDTH_GRID_MAP[ width ];

				if ( counter === 9 ) {
					[ classNames, counter ] = resizeClasses( classNames, counter );
				}

				counter = WIDTH_GRID_MAP[ width ];
			}
		} );

		if ( counter === 9 ) {
			[ classNames, counter ] = resizeClasses( classNames, counter );
		}

		return classNames;
	}, [ widgets, activeWidgets ] );

	return (
		<div className={ classnames( 'mdc-layout-grid', 'googlesitekit-widget-area', `googlesitekit-widget-area--${ widgetArea.slug }`, `googlesitekit-widget-area--${ widgetArea.style }` ) }>
			<div className="mdc-layout-grid__inner">
				<header className={ classnames(
					'googlesitekit-widget-area-header',
					'mdc-layout-grid__cell--span-12'
				) }>
					<img alt="" src={ widgetArea.icon } />
					{ widgetArea.title &&
					<h3 className={ classnames(
						'googlesitekit-heading-3',
						'googlesitekit-widget-area-header__title'
					) }>
						{ widgetArea.title }
					</h3> }
					{ widgetArea.subtitle &&
					<h4 className="googlesitekit-widget-area-header__subtitle">{ widgetArea.subtitle }</h4>
					}
				</header>
			</div>
			<div className="googlesitekit-widget-area-widgets">
				<div className="mdc-layout-grid__inner">
					{ widgets.map( ( widget, i ) => {
						return (
							<WidgetRenderer
								gridClassName={ widgetClassNames[ i ] !== null ? classnames( widgetClassNames[ i ] ) : 'googlesitekit-widget-area--hidden' }
								key={ widget.slug }
								slug={ widget.slug }
								activeWidgets={ activeWidgets }
								setActiveWidgets={ setActiveWidgets }
							/>
						);
					} ) }
				</div>
			</div>
		</div>
	);
};

WidgetAreaRenderer.propTypes = {
	slug: string.isRequired,
};

export default WidgetAreaRenderer;
