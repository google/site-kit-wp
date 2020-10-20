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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
import Widget from './Widget';

const { useSelect } = Data;

const WidgetRenderer = ( { slug, gridClassName } ) => {
	const widget = useSelect( ( select ) => select( STORE_NAME ).getWidget( slug ) );

	if ( ! widget ) {
		return null;
	}

	// Capitalize the "component" variable, as it is required by JSX.
	const { component: Component, wrapWidget } = widget;

	let widgetComponent = <Component />;

	if ( wrapWidget ) {
		widgetComponent = <Widget slug={ slug }>{ widgetComponent }</Widget>;
	}

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
};

export default WidgetRenderer;
