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
import LostEventsSubtleNotification from './LostEventsSubtleNotification';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

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
		if ( haveLostConversionEvents ) {
			setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );

			dismissLostConversionReportingEvents();
		}
	}, [
		setValue,
		haveLostConversionEvents,
		dismissLostConversionReportingEvents,
	] );

	if (
		! shouldShowInitialCalloutForTailoredMetrics &&
		! haveLostConversionEvents
	) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding fullWidth>
			{ haveLostConversionEvents && (
				<LostEventsSubtleNotification
					onSelectMetricsCallback={ handleSelectMetricsClick }
					onDismissCallback={ dismissLostConversionReportingEvents }
				/>
			) }
			{ shouldShowInitialCalloutForTailoredMetrics && (
				<ConversionReportingDashboardSubtleNotification
					ctaLabel={ __( 'Add metrics', 'google-site-kit' ) }
					handleCTAClick={ handleAddMetricsClick }
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
