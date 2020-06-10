/**
 * WidgetArea component.
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
import Widget from './widget';

const { useSelect } = Data;

const WidgetArea = ( { area } ) => {
	const widgetArea = useSelect( ( select ) => select( STORE_NAME ).getWidgetArea( area ) );
	const widgets = useSelect( ( select ) => select( STORE_NAME ).getWidgets( area ) );

	return (
		<div className={ classnames( 'mdc-layout-grid', 'WidgetArea', `WidgetArea-${ widgetArea.style }`, `WidgetArea-${ widgetArea.slug }` ) }>
			<div className="mdc-layout-grid__inner">
				<header className={ classnames(
					'googlesitekit-widget-area-header',
					'mdc-layout-grid__cell',
					'mdc-layout-grid__cell--span-12-desktop',
					'mdc-layout-grid__cell--span-8-tablet',
					'mdc-layout-grid__cell--span-4-phone',
				) }>
					{ /*
							Disabled legitimately, because these icons don't have appropriate
							alt-text and should only be used decoratively.
						*/ }
					{ /* eslint-disable-next-line jsx-a11y/alt-text */ }
					<img src={ widgetArea.icon } />
					{ widgetArea.title &&
					<h3 className="
									googlesitekit-heading-3
									googlesitekit-widget-area-header__title
								">
						{ widgetArea.title }
					</h3> }
					{ widgetArea.subtitle &&
					<h4 className="googlesitekit-widget-area-header__subtitle">{ widgetArea.subtitle }</h4>
					}
				</header>
			</div>
			<div className="googlesitekit-layout">
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

WidgetArea.propTypes = {
	area: string.isRequired,
};

export default WidgetArea;
