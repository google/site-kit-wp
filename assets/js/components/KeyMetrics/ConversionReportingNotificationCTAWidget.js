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
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';

function ConversionReportingNotificationCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const { setValue } = useDispatch( CORE_UI );

	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const keyMetricSettings = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);
	const hasUserPickedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);

	const haveConversionReportingEventsForTailoredMetrics = useSelect(
		( select ) =>
			select(
				MODULES_ANALYTICS_4
			).haveConversionEventsForTailoredMetrics()
	);

	// Initial callout is surfaced to the users with tailored metrics, if detectedEvents setting
	// has a conversion event associated with the ACR key metrics matching the current site purpose answer.
	// If new ACR key metrics that can be added are found using haveConversionReportingEventsForTailoredMetrics,
	// and have not been already included, which is determined by includeConversionTailoredMetrics setting, callout banner should be displayed.
	const shouldShowInitialCalloutForTailoredMetrics =
		! hasUserPickedMetrics?.length &&
		isUserInputCompleted &&
		haveConversionReportingEventsForTailoredMetrics &&
		! keyMetricSettings?.includeConversionTailoredMetrics;

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	const hasConversionEventsForUserPickedMetrics = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).haveConversionEventsForUserPickedMetrics()
	);

	// If users have set up key metrics manually and ACR events are detected,
	// we display the same callout banner, with a different call to action
	// "Select metrics" which opens the metric selection panel.
	const shouldShowCalloutForUserPickedMetrics =
		hasUserPickedMetrics?.length &&
		isKeyMetricsSetupCompleted &&
		hasConversionEventsForUserPickedMetrics;

	const { setKeyMetricsSetting, saveKeyMetricsSettings } =
		useDispatch( CORE_USER );
	const { dismissNewConversionReportingEvents } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleAddMetricsClick = useCallback( () => {
		if ( shouldShowInitialCalloutForTailoredMetrics ) {
			setIsSaving( true );
			setKeyMetricsSetting( 'includeConversionTailoredMetrics', true );
			saveKeyMetricsSettings( {
				widgetSlugs: undefined,
			} );
			setIsSaving( false );
		}

		dismissNewConversionReportingEvents();
	}, [
		setKeyMetricsSetting,
		saveKeyMetricsSettings,
		dismissNewConversionReportingEvents,
		shouldShowInitialCalloutForTailoredMetrics,
	] );

	const handleSelectMetricsClick = useCallback( () => {
		if ( shouldShowCalloutForUserPickedMetrics ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );

			dismissNewConversionReportingEvents();
		}
	}, [
		setValue,
		shouldShowCalloutForUserPickedMetrics,
		dismissNewConversionReportingEvents,
	] );

	if (
		! shouldShowInitialCalloutForTailoredMetrics &&
		! shouldShowCalloutForUserPickedMetrics
	) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding fullWidth>
			<ConversionReportingDashboardSubtleNotification
				ctaLabel={
					shouldShowInitialCalloutForTailoredMetrics
						? __( 'Add metrics', 'google-site-kit' )
						: __( 'Select metrics', 'google-site-kit' )
				}
				handleCTAClick={
					shouldShowInitialCalloutForTailoredMetrics
						? handleAddMetricsClick
						: handleSelectMetricsClick
				}
				isSaving={ isSaving }
				onDismiss={ dismissNewConversionReportingEvents }
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
