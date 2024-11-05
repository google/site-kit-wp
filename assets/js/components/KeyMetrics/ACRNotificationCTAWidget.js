/**
 * ACRNotificationCTAWidget component.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import whenActive from '../../util/when-active';
import ACRDashboardSubtleNotification from './ACRDashboardSubtleNotification';

function ACRNotificationCTAWidget( { Widget, WidgetNull } ) {
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const hasUsefulConversionReportingEvents = useSelect( ( select ) => {
		const newConversionReportingEvents =
			select( MODULES_ANALYTICS_4 ).hasNewConversionReportingEvents();
		if ( ! newConversionReportingEvents ) {
			return false;
		}

		// TODO: Complete rendering logic.
		return true;
	} );

	if ( ! isUserInputCompleted || ! hasUsefulConversionReportingEvents ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding fullWidth>
			<ACRDashboardSubtleNotification />
		</Widget>
	);
}

ACRNotificationCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	ACRNotificationCTAWidget
);
