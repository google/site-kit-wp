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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore';
import { string } from 'prop-types';
import WidgetWrapper from './widget-wrapper';

const { useSelect } = Data;

const Widget = ( { slug } ) => {
	const widget = useSelect( ( select ) => select( STORE_NAME ).getWidget( slug ) );
	// Capitalize the "component" variable, as it is required by JSX.
	const { component: Component } = widget;
	const widgetOutput = <Component slug={ slug } />;

	if ( widget.useWrapper ) {
		return (
			<WidgetWrapper slug={ slug }>{ widgetOutput }</WidgetWrapper>
		);
	}

	return widgetOutput;
};

Widget.propTypes = {
	slug: string.isRequired,
};

export default Widget;
