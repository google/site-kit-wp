/**
 * ConversionReportingNotificationCTAWidget component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import whenActive from '../../util/when-active';
import ConversionReportingDashboardSubtleNotification from './ConversionReportingDashboardSubtleNotification';
import { useConversionReportingEventsForTailoredMetrics } from './hooks/useConversionReportingEventsForTailoredMetrics';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

function ConversionReportingNotificationCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const userInputSettings = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettings()
	);
	const keyMetricSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);

	const { setKeyMetricsSetting, saveKeyMetricsSettings } =
		useDispatch( CORE_USER );
	const { dismissNewConversionReportingEvents } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleCTAClick = useCallback( async () => {
		setIsSaving( true );
		await setKeyMetricsSetting( 'includeConversionTailoredMetrics', true );
		await saveKeyMetricsSettings( {
			widgetSlugs: undefined,
		} );
		dismissNewConversionReportingEvents();
		setIsSaving( false );
	}, [
		setKeyMetricsSetting,
		saveKeyMetricsSettings,
		dismissNewConversionReportingEvents,
	] );

	const onDismiss = useCallback( () => {
		dismissNewConversionReportingEvents();
	}, [ dismissNewConversionReportingEvents ] );

	const purpose = userInputSettings?.purpose?.values?.[ 0 ];
	const haveConversionReportingEventsForTailoredMetrics =
		useConversionReportingEventsForTailoredMetrics( purpose );

	// Initial callout is surfaced to the users with tailored metrics, if detectedEvents setting
	// has a conversion event associated with the ACR key metrics matching the current site purpose answer.
	// If new ACR key metrics that can be added are found using haveConversionReportingEventsForTailoredMetrics,
	// and have not been already included, which is determined by includeConversionTailoredMetrics setting, callout banner should be displayed.
	const shouldShowInitialCalloutForTailoredMetrics =
		isUserInputCompleted &&
		haveConversionReportingEventsForTailoredMetrics &&
		! keyMetricSettings?.includeConversionTailoredMetrics;

	if ( ! shouldShowInitialCalloutForTailoredMetrics ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding fullWidth>
			<ConversionReportingDashboardSubtleNotification
				ctaLabel={ __( 'Add metrics', 'google-site-kit' ) }
				handleCTAClick={ handleCTAClick }
				isSaving={ isSaving }
				onDismiss={ onDismiss }
			/>
		</Widget>
	);
}

ConversionReportingNotificationCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType,
};

export default whenActive( { moduleName: 'analytics-4' } )(
	ConversionReportingNotificationCTAWidget
);
