/**
 * WidgetRenderer component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import Widget from './Widget';
import WidgetReportZero from './WidgetReportZero';
import WidgetActivateModuleCTA from './WidgetActivateModuleCTA';
import WidgetCompleteModuleActivationCTA from './WidgetCompleteModuleActivationCTA';

const { useSelect } = Data;

function withWidgetSlug( widgetSlug ) {
	return ( WrappedComponent ) => {
		return ( props ) => <WrappedComponent widgetSlug={ widgetSlug } { ...props } />;
	};
}

const WidgetRenderer = ( { slug, gridClassName, OverrideComponent } ) => {
	const widget = useSelect( ( select ) => select( STORE_NAME ).getWidget( slug ) );

	// Scope widget-specific components to the widget instance so that the
	// component does not need to (re-)specify the widget slug.
	const widgetComponentProps = {
		WidgetReportZero: useMemo( () => withWidgetSlug( slug )( WidgetReportZero ), [ WidgetReportZero, slug ] ),
		WidgetActivateModuleCTA: useMemo( () => withWidgetSlug( slug )( WidgetActivateModuleCTA ), [ WidgetActivateModuleCTA, slug ] ),
		WidgetCompleteModuleActivationCTA: useMemo( () => withWidgetSlug( slug )( WidgetCompleteModuleActivationCTA ), [ WidgetCompleteModuleActivationCTA, slug ] ),
	};

	if ( ! widget ) {
		return null;
	}

	const { Component, wrapWidget } = widget;

	let widgetComponent = <Component { ...widgetComponentProps } />;

	if ( OverrideComponent ) {
		// If OverrideComponent passed, render it instead of the actual widget.
		// It always needs to be wrapped as it is expected to be a
		// widget-agnostic component.
		// The real widget component will still be rendered, but it will be
		// hidden via CSS.
		widgetComponent = (
			<Fragment>
				<Widget slug="overridden">
					<OverrideComponent />
				</Widget>
				<div className="googlesitekit-widget-grid-hidden">
					{ widgetComponent }
				</div>
			</Fragment>
		);
	} else if ( wrapWidget ) {
		// Otherwise, wrap the component only if that is requested for this
		// widget.
		widgetComponent = <Widget slug={ slug }>{ widgetComponent }</Widget>;
	}

	// Wrap the widget into a grid class.
	if ( gridClassName ) {
		widgetComponent = (
			<div className={ gridClassName }>
				{ widgetComponent }
			</div>
		);
	}

	return widgetComponent;
};

WidgetRenderer.propTypes = {
	slug: PropTypes.string.isRequired,
	gridClassName: PropTypes.string,
	OverrideComponent: PropTypes.elementType,
};

export default WidgetRenderer;
