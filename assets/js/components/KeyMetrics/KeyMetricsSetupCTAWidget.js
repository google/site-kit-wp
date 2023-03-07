/**
 * KeyMetricsSetupCTAWidget component.
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
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
const { useSelect } = Data;

function KeyMetricsSetupCTAWidget( { Widget, WidgetNull } ) {
	const userInputEnabled = useFeature( 'userInput' );

	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const searchConsoleModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'search-console' )
	);
	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	if (
		! userInputEnabled ||
		isUserInputCompleted === undefined ||
		isUserInputCompleted ||
		! analyticsModuleConnected ||
		! searchConsoleModuleConnected
	) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<div>TODO: UI for KeyMetricsSetupCTAWidget</div>
		</Widget>
	);
}

KeyMetricsSetupCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default KeyMetricsSetupCTAWidget;
