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
import { STORE_NAME as CORE_MODULES } from '../../modules/datastore/constants';
import WidgetRenderer from './WidgetRenderer';
import { getWidgetClassNames } from '../util';
import { Cell, Grid, Row } from '../../../material-components';
const { useSelect } = Data;

export default function WidgetAreaRenderer( { slug } ) {
	const { modules, resolvedModules } = useSelect( ( select ) => ( {
		modules: select( CORE_MODULES ).getModules(),
		resolvedModules: select( CORE_MODULES ).hasFinishedResolution( 'getModules', [] ),
	} ) );

	const { widgets, widgetArea } = useSelect( ( select ) => ( {
		widgetArea: select( STORE_NAME ).getWidgetArea( slug ),
		widgets: select( STORE_NAME ).getWidgets( slug ),
	} ) );

	// Don't render widgets until getModules isn't resolved because widgets rely
	// on module information and we need to minimize getModules resolution timeout
	// to properly determine which widgets should be rendered.
	if ( ! resolvedModules ) {
		return null;
	}

	const activeWidgets = widgets.filter( ( widget ) => {
		if ( Array.isArray( widget.modules ) && widget.modules.length > 0 ) {
			for ( const module of widget.modules ) {
				if ( ! modules[ module ]?.active || ! modules[ module ]?.connected ) {
					return false;
				}
			}
		}

		return true;
	} );

	if ( activeWidgets.length === 0 ) {
		return null;
	}

	const widgetClassNames = getWidgetClassNames( activeWidgets );
	const widgetsOutput = activeWidgets.map( ( widget, i ) => (
		<WidgetRenderer
			gridClassName={ widgetClassNames[ i ] !== null ? classnames( widgetClassNames[ i ] ) : 'googlesitekit-widget-area--hidden' }
			key={ widget.slug }
			slug={ widget.slug }
		/>
	) );

	return (
		<Grid className={ `googlesitekit-widget-area googlesitekit-widget-area--${ widgetArea.slug } googlesitekit-widget-area--${ widgetArea.style }` }>
			<Row>
				<Cell className="googlesitekit-widget-area-header" size={ 12 }>
					<img alt="" src={ widgetArea.icon } />

					{ widgetArea.title && (
						<h3 className="googlesitekit-widget-area-header__title googlesitekit-heading-3">
							{ widgetArea.title }
						</h3>
					) }

					{ widgetArea.subtitle && (
						<h4 className="googlesitekit-widget-area-header__subtitle">
							{ widgetArea.subtitle }
						</h4>
					) }
				</Cell>
			</Row>

			<div className="googlesitekit-widget-area-widgets">
				<Row>
					{ widgetArea.style === WIDGET_AREA_STYLES.BOXES && widgetsOutput }
					{ widgetArea.style === WIDGET_AREA_STYLES.COMPOSITE && (
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
