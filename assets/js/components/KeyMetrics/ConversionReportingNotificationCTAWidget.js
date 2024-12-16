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
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import ConversionReportingDashboardSubtleNotification from './ConversionReportingDashboardSubtleNotification';
import LostEventsSubtleNotification from './LostEventsSubtleNotification';
import whenActive from '../../util/when-active';

function ConversionReportingNotificationCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);

	const hasUserPickedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);

	const haveLostConversionEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).haveLostEventsForCurrentMetrics()
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
		haveConversionReportingEventsForTailoredMetrics;

	const hasConversionEventsForUserPickedMetrics = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).haveConversionEventsForUserPickedMetrics(
			true
		)
	);
	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	// If users have set up key metrics manually and ACR events are detected,
	// we display the same callout banner, with a different call to action
	// "Select metrics" which opens the metric selection panel.
	const shouldShowCalloutForUserPickedMetrics =
		hasUserPickedMetrics?.length &&
		isKeyMetricsSetupCompleted &&
		hasConversionEventsForUserPickedMetrics;

	const haveConversionEventsWithDifferentMetrics = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).haveConversionEventsWithDifferentMetrics()
	);

	// If new events have been detected after initial set of events, we display
	// the same callout banner, with a different call to action "View metrics"
	// which opens the metric selection panel.
	const shouldShowCalloutForNewEvents =
		isKeyMetricsSetupCompleted && haveConversionEventsWithDifferentMetrics;

	const userInputPurposeConversionEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUserInputPurposeConversionEvents()
	);

	const { setKeyMetricsSetting, saveKeyMetricsSettings } =
		useDispatch( CORE_USER );
	const {
		dismissNewConversionReportingEvents,
		dismissLostConversionReportingEvents,
	} = useDispatch( MODULES_ANALYTICS_4 );

	const handleAddMetricsClick = useCallback( () => {
		if ( shouldShowInitialCalloutForTailoredMetrics ) {
			setIsSaving( true );
			setKeyMetricsSetting(
				'includeConversionTailoredMetrics',
				userInputPurposeConversionEvents
			);
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
		userInputPurposeConversionEvents,
		shouldShowInitialCalloutForTailoredMetrics,
	] );

	const { setValue } = useDispatch( CORE_UI );

	const handleSelectMetricsClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );

		if ( shouldShowCalloutForUserPickedMetrics ) {
			dismissNewConversionReportingEvents();
		}

		if ( haveLostConversionEvents ) {
			dismissLostConversionReportingEvents();
		}
	}, [
		setValue,
		shouldShowCalloutForUserPickedMetrics,
		haveLostConversionEvents,
		dismissNewConversionReportingEvents,
		dismissLostConversionReportingEvents,
	] );

	if (
		! shouldShowInitialCalloutForTailoredMetrics &&
		! haveLostConversionEvents &&
		! shouldShowCalloutForUserPickedMetrics &&
		! shouldShowCalloutForNewEvents
	) {
		return <WidgetNull />;
	}

	let ctaLabel = __( 'Select metrics', 'google-site-kit' );

	if ( shouldShowInitialCalloutForTailoredMetrics ) {
		ctaLabel = __( 'Add metrics', 'google-site-kit' );
	}
	if ( shouldShowCalloutForNewEvents ) {
		ctaLabel = __( 'View metrics', 'google-site-kit' );
	}

	return (
		<Widget noPadding fullWidth>
			{ haveLostConversionEvents && (
				<LostEventsSubtleNotification
					onSelectMetricsCallback={ handleSelectMetricsClick }
					onDismissCallback={ dismissLostConversionReportingEvents }
				/>
			) }
			{ ( shouldShowInitialCalloutForTailoredMetrics ||
				shouldShowCalloutForUserPickedMetrics ||
				shouldShowCalloutForNewEvents ) && (
				<ConversionReportingDashboardSubtleNotification
					ctaLabel={ ctaLabel }
					handleCTAClick={
						shouldShowInitialCalloutForTailoredMetrics
							? handleAddMetricsClick
							: handleSelectMetricsClick
					}
					isSaving={ isSaving }
					onDismiss={ dismissNewConversionReportingEvents }
				/>
			) }
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
