/**
 * Key Metrics Selection Panel Error
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
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
	MAX_SELECTED_METRICS_COUNT,
	MAX_SELECTED_METRICS_COUNT_WITH_CONVERSION_EVENTS,
	MIN_SELECTED_METRICS_COUNT,
} from '../constants';
import SelectionPanelError from '../../SelectionPanel/SelectionPanelError';
import { safelySort } from '../../../util';
import whenActive from '../../../util/when-active';
import { useFeature } from '../../../hooks/useFeature';

function KeyMetricsError( { savedMetrics } ) {
	const isConversionReportingEnabled = useFeature( 'conversionReporting' );

	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);

	const keyMetricsSettings = useInViewSelect( ( select ) =>
		select( CORE_USER ).getKeyMetricsSettings()
	);

	const haveSettingsChanged = useMemo( () => {
		// Arrays need to be sorted to match in `isEqual`.
		return ! isEqual(
			safelySort( selectedMetrics ),
			safelySort( savedMetrics )
		);
	}, [ savedMetrics, selectedMetrics ] );

	const saveError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveKeyMetricsSettings', [
			{
				...keyMetricsSettings,
				widgetSlugs: selectedMetrics,
			},
		] )
	);

	const selectedMetricsCount = selectedMetrics?.length || 0;
	const maxSelectedMetricsLimit = isConversionReportingEnabled
		? MAX_SELECTED_METRICS_COUNT_WITH_CONVERSION_EVENTS
		: MAX_SELECTED_METRICS_COUNT;
	let metricsLimitError;
	if ( selectedMetricsCount < MIN_SELECTED_METRICS_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Minimum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select at least %1$d metrics (%2$d selected)',
				'google-site-kit'
			),
			MIN_SELECTED_METRICS_COUNT,
			selectedMetricsCount
		);
	} else if ( selectedMetricsCount > maxSelectedMetricsLimit ) {
		metricsLimitError = sprintf(
			/* translators: 1: Maximum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select up to %1$d metrics (%2$d selected)',
				'google-site-kit'
			),

			maxSelectedMetricsLimit,
			selectedMetricsCount
		);
	}

	let error = saveError;

	if ( haveSettingsChanged && metricsLimitError ) {
		error = { message: metricsLimitError };
	}

	return (
		<SelectionPanelError
			error={ error }
			skipRetryMessage={ !! metricsLimitError }
		/>
	);
}

export default whenActive( { moduleName: 'analytics-4' } )( KeyMetricsError );
