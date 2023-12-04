/**
 * WidgetRenderer component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import PropTypes from 'prop-types';
import { intersection } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_WIDGETS } from '../datastore/constants';
import { CORE_MODULES } from '../../modules/datastore/constants';
import BaseWidget from './Widget';
import WidgetRecoverableModules from './WidgetRecoverableModules';
import { getWidgetComponentProps } from '../util';
import { HIDDEN_CLASS } from '../util/constants';
import useViewOnly from '../../../hooks/useViewOnly';

const { useSelect } = Data;

function WidgetRenderer( { slug, OverrideComponent } ) {
	const widget = useSelect( ( select ) =>
		select( CORE_WIDGETS ).getWidget( slug )
	);
	const widgetComponentProps = getWidgetComponentProps( slug );
	const { Widget, WidgetNull } = widgetComponentProps;

	const recoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getRecoverableModules()
	);

	const viewOnly = useViewOnly();
	const widgetRecoverableModules = useMemo(
		() =>
			widget &&
			recoverableModules &&
			intersection( widget.modules, Object.keys( recoverableModules ) ),
		[ recoverableModules, widget ]
	);

	const isWidgetPreloaded = useSelect( ( select ) =>
		select( CORE_WIDGETS ).isWidgetPreloaded( slug )
	);

	if ( ! widget ) {
		return <WidgetNull />;
	}

	const { Component, wrapWidget } = widget;

	let widgetElement = <Component { ...widgetComponentProps } />;

	if ( viewOnly && widgetRecoverableModules?.length ) {
		widgetElement = (
			<WidgetRecoverableModules
				widgetSlug={ slug }
				moduleSlugs={ widgetRecoverableModules }
			/>
		);
	}

	if ( OverrideComponent ) {
		// If OverrideComponent passed, render it instead of the actual widget.
		// It always needs to be wrapped as it is expected to be a
		// widget-unaware component.
		// The real widget component will still be rendered, but it will be
		// hidden via CSS.
		widgetElement = (
			<Fragment>
				<BaseWidget widgetSlug="overridden">
					<OverrideComponent />
				</BaseWidget>
				<div className={ HIDDEN_CLASS }>{ widgetElement }</div>
			</Fragment>
		);
	} else if ( wrapWidget ) {
		// Otherwise, wrap the component only if that is requested for this
		// widget.
		widgetElement = <Widget>{ widgetElement }</Widget>;
	}

	if ( isWidgetPreloaded ) {
		// If the widget is preloaded, hide it.
		return <div className={ HIDDEN_CLASS }>{ widgetElement }</div>;
	}

	return widgetElement;
}

WidgetRenderer.propTypes = {
	slug: PropTypes.string.isRequired,
	OverrideComponent: PropTypes.elementType,
};

export default WidgetRenderer;
