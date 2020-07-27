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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore';
import Widget from './WidgetRenderer';

const { useSelect } = Data;

const WidgetAreaRenderer = ( { slug } ) => {
	const widgetArea = useSelect( ( select ) => select( STORE_NAME ).getWidgetArea( slug ) );
	const widgets = useSelect( ( select ) => select( STORE_NAME ).getWidgets( slug ) );

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
					{ widgets.map( ( widget ) => {
						return (
							<Widget key={ widget.slug } slug={ widget.slug } />
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
