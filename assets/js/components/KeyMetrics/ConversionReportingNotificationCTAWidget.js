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
import { useCallback, useState, useEffect } from '@wordpress/element';

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
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import ConversionReportingDashboardSubtleNotification from './ConversionReportingDashboardSubtleNotification';
import LostEventsSubtleNotification from './LostEventsSubtleNotification';
import whenActive from '../../util/when-active';
import useDisplayNewEventsCalloutForTailoredMetrics from './hooks/useDisplayNewEventsCalloutForTailoredMetrics';
import useDisplayNewEventsCalloutForUserPickedMetrics from './hooks/useDisplayNewEventsCalloutForUserPickedMetrics';
import useDisplayNewEventsCalloutAfterInitialDetection from './hooks/useDisplayNewEventsCalloutAfterInitialDetection';

function ConversionReportingNotificationCTAWidget( { Widget, WidgetNull } ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const haveLostConversionEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).haveLostEventsForCurrentMetrics()
	);

	const newConversionEventsLastUpdateAt = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getNewConversionEventsLastUpdateAt()
	);
	const lostConversionEventsLastUpdateAt = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getLostConversionEventsLastUpdateAt()
	);
	const haveNewConversionEventsAfterDismiss = useSelect( ( select ) =>
		select( CORE_USER ).haveNewConversionEventsAfterDismiss(
			newConversionEventsLastUpdateAt
		)
	);
	const haveLostConversionEventsAfterDismiss = useSelect( ( select ) =>
		select( CORE_USER ).haveLostConversionEventsAfterDismiss(
			lostConversionEventsLastUpdateAt
		)
	);

	// Initial callout is surfaced to the users with tailored metrics, if detectedEvents setting
	// has a conversion event associated with the ACR key metrics matching the current site purpose answer.
	// If new ACR key metrics that can be added are found using haveConversionReportingEventsForTailoredMetrics,
	// and have not been already included, which is determined by includeConversionEvents user input setting, callout banner should be displayed.
	const shouldShowInitialCalloutForTailoredMetrics =
		useDisplayNewEventsCalloutForTailoredMetrics(
			haveNewConversionEventsAfterDismiss
		);

	// If users have set up key metrics manually and ACR events are detected,
	// we display the same callout banner, with a different call to action
	// "Select metrics" which opens the metric selection panel.
	const shouldShowCalloutForUserPickedMetrics =
		useDisplayNewEventsCalloutForUserPickedMetrics(
			haveNewConversionEventsAfterDismiss
		);

	// If new events have been detected after initial set of events, we display
	// the same callout banner, with a different call to action "View metrics"
	// which opens the metric selection panel.
	const shouldShowCalloutForNewEvents =
		useDisplayNewEventsCalloutAfterInitialDetection(
			haveNewConversionEventsAfterDismiss
		);

	const shouldShowCalloutForLostEvents =
		haveLostConversionEvents && haveLostConversionEventsAfterDismiss;

	const { saveConversionReportingSettings } = useDispatch( CORE_USER );

	const dismissCallout = useCallback(
		async ( eventType ) => {
			// Dismissed callout settings times should rely on real times, not the reference date,
			// so the timestamps are consistent even when changing the reference dates when developing/testing.
			const timestamp = Math.round( Date.now() / 1000 ); // eslint-disable-line sitekit/no-direct-date
			const conversionReportingSettings = {
				newEventsCalloutDismissedAt: timestamp,
			};
			if ( eventType === 'lostEvents' ) {
				conversionReportingSettings.lostEventsCalloutDismissedAt =
					timestamp;
			}

			await saveConversionReportingSettings(
				conversionReportingSettings
			);
		},
		[ saveConversionReportingSettings ]
	);

	const userInputPurposeConversionEvents = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUserInputPurposeConversionEvents()
	);

	const { setUserInputSetting, saveUserInputSettings } =
		useDispatch( CORE_USER );

	const handleAddMetricsClick = useCallback( () => {
		if ( shouldShowInitialCalloutForTailoredMetrics ) {
			setIsSaving( true );
			setUserInputSetting(
				'includeConversionEvents',
				userInputPurposeConversionEvents
			);
			saveUserInputSettings();
			setIsSaving( false );
		}

		dismissCallout();
	}, [
		setUserInputSetting,
		saveUserInputSettings,
		dismissCallout,
		userInputPurposeConversionEvents,
		shouldShowInitialCalloutForTailoredMetrics,
	] );

	const { setValue } = useDispatch( CORE_UI );

	const handleSelectMetricsClick = useCallback( () => {
		setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
	);
	const isSavingConversionReportingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingConversionReportingSettings()
	);

	useEffect( () => {
		if ( isSelectionPanelOpen ) {
			if (
				// Dismiss the new events callout if shouldShowCalloutForNewEvents is true
				// and settings are not being saved. This prevents duplicate requests, as after
				// the first call, the settings enter the saving state. Once saving is complete,
				// shouldShowCalloutForNewEvents will no longer be true.
				( ! isSavingConversionReportingSettings &&
					( shouldShowCalloutForNewEvents ||
						shouldShowCalloutForUserPickedMetrics ) ) ||
				// shouldShowInitialCalloutForTailoredMetrics is more specific because the "Add metrics"
				// CTA does not open the panel; it directly adds metrics. We want to dismiss this callout
				// only when the user opens the selection panel and saves their metrics selection. This marks
				// the transition to manual selection, after which this callout should no longer be shown.
				( shouldShowInitialCalloutForTailoredMetrics &&
					isSavingConversionReportingSettings )
			) {
				dismissCallout();
			}

			if ( shouldShowCalloutForLostEvents ) {
				dismissCallout( 'lostEvents' );
			}
		}
	}, [
		isSelectionPanelOpen,
		shouldShowCalloutForNewEvents,
		shouldShowCalloutForUserPickedMetrics,
		shouldShowInitialCalloutForTailoredMetrics,
		isSavingConversionReportingSettings,
		shouldShowCalloutForLostEvents,
		dismissCallout,
	] );

	if (
		! shouldShowInitialCalloutForTailoredMetrics &&
		! shouldShowCalloutForLostEvents &&
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
			{ shouldShowCalloutForLostEvents && (
				<LostEventsSubtleNotification
					onSelectMetricsCallback={ handleSelectMetricsClick }
					onDismissCallback={ () => dismissCallout( 'lostEvents' ) }
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
					onDismiss={ dismissCallout }
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
