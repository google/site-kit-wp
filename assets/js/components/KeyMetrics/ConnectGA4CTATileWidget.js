/**
 * ConnectGA4CTATileWidget component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import ConnectGA4CTATile from './ConnectGA4CTATile';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function ConnectGA4CTATileWidget( { Widget, WidgetNull } ) {
	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	if ( isGA4ModuleConnected !== false ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<ConnectGA4CTATile />
		</Widget>
	);
}

ConnectGA4CTATileWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
