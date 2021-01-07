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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, WIDGET_AREA_STYLES } from '../datastore/constants';
import WidgetRenderer from './WidgetRenderer';
import { getWidgetLayout, combineWidgets } from '../util';
import { Cell, Grid, Row } from '../../../material-components';
const { useSelect } = Data;

export default function WidgetAreaRenderer( { slug } ) {
	const widgetArea = useSelect( ( select ) => select( STORE_NAME ).getWidgetArea( slug ) );

	const { widgets, widgetStates } = useSelect( ( select ) => {
		const allWidgets = select( STORE_NAME ).getWidgets( slug );
		const allWidgetStates = {};
		allWidgets.forEach( ( widget ) => {
			allWidgetStates[ widget.slug ] = select( STORE_NAME ).getWidgetState( widget.slug );
		} );
		return {
			widgets: allWidgets,
			widgetStates: allWidgetStates,
		};
	} );

	const activeWidgets = widgets.filter( ( widget ) => {
		const widgetExists = widgets.some( ( item ) => item.slug === widget.slug );
		const isComponent = typeof widget.Component === 'function';
		const isActive = 	widget.Component.prototype.render
			? new widget.Component( {} ).render()
			: widget.Component( {} );

		return widgetExists && isComponent && Boolean( isActive );
	} );

	if ( activeWidgets.length === 0 ) {
		return null;
	}

	// Compute the layout.
	const {
		classNames,
		columnWidths,
		rowIndexes,
	} = getWidgetLayout( activeWidgets );

	// Combine widgets with similar CTAs and prepare final props to pass to
	// `WidgetRenderer` below. Only one consecutive instance of a similar CTA
	// will be maintained (via an "override component"), and all other similar
	// ones will receive a CSS class to hide them.
	// A combined CTA will span the combined width of all widgets that it was
	// combined from.
	const {
		gridClassNames,
		overrideComponents,
	} = combineWidgets( activeWidgets, widgetStates, {
		classNames,
		columnWidths,
		rowIndexes,
	} );

	// Render all widgets.
	const widgetsOutput = activeWidgets.map( ( widget, i ) => (
		<WidgetRenderer
			gridClassName={ classnames( gridClassNames[ i ] ) }
			OverrideComponent={ overrideComponents[ i ] }
			key={ widget.slug }
			slug={ widget.slug }
		/>
	) );

	const { Icon, title, style, subtitle } = widgetArea;

	return (
		<Grid className={ `googlesitekit-widget-area googlesitekit-widget-area--${ slug } googlesitekit-widget-area--${ style }` }>
			<Row>
				<Cell className="googlesitekit-widget-area-header" size={ 12 }>
					{ Icon && (
						<Icon width={ 33 } height={ 33 } />
					) }

					{ title && (
						<h3 className="googlesitekit-widget-area-header__title googlesitekit-heading-3">
							{ title }
						</h3>
					) }

					{ subtitle && (
						<h4 className="googlesitekit-widget-area-header__subtitle">
							{ subtitle }
						</h4>
					) }
				</Cell>
			</Row>

			<div className="googlesitekit-widget-area-widgets">
				<Row>
					{ style === WIDGET_AREA_STYLES.BOXES && widgetsOutput }
					{ style === WIDGET_AREA_STYLES.COMPOSITE && (
						<Cell size={ 12 }>
							<Grid>
								<Row>
									{ widgetsOutput }
								</Row>
							</Grid>
						</Cell>
					) }
				</Row>
			</div>
		</Grid>
	);
}

WidgetAreaRenderer.propTypes = {
	slug: PropTypes.string.isRequired,
};
