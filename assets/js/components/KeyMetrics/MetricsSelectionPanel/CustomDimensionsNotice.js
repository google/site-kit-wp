/**
 * Key Metrics Selection Panel Notice
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePrevious } from '@wordpress/compose';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_SELECTED, KEY_METRICS_SELECTION_FORM } from '../constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { EDIT_SCOPE as ANALYTICS_EDIT_SCOPE } from '../../../modules/analytics/datastore/constants';
import { elementsOverlap } from '../../../util/geometry';
import whenActive from '../../../util/when-active';
const { useSelect } = Data;

function CustomDimensionsNotice() {
	const selectedMetrics = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			KEY_METRICS_SELECTION_FORM,
			KEY_METRICS_SELECTED
		)
	);

	const requiredCustomDimensions = selectedMetrics?.flatMap( ( tileName ) => {
		const tile = KEY_METRICS_WIDGETS[ tileName ];
		return tile?.requiredCustomDimensions || [];
	} );

	const hasMissingCustomDimensions = useSelect( ( select ) => {
		if ( ! requiredCustomDimensions?.length ) {
			return false;
		}

		return ! select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
			requiredCustomDimensions
		);
	} );
	const hasAnalytics4EditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( ANALYTICS_EDIT_SCOPE )
	);

	// This is called here to ensure that the list of available custom dimensions is
	// synced and loaded, preventing flickers of the notice.
	useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions()
	);

	const previousHasMissingCustomDimensions = usePrevious(
		hasMissingCustomDimensions
	);
	const noticeRef = useRef();

	// Scroll the metric item being overlapped by the notice that appears
	// when the item selected (normally the last item in the panel) requires
	// custom dimension permissions.
	useEffect( () => {
		if (
			hasMissingCustomDimensions &&
			previousHasMissingCustomDimensions === false
		) {
			const currentFocusedElement =
				noticeRef.current?.ownerDocument.activeElement;

			if (
				currentFocusedElement &&
				currentFocusedElement.closest(
					'.googlesitekit-km-selection-panel-metrics__metric-item'
				) &&
				elementsOverlap( noticeRef.current, currentFocusedElement )
			) {
				currentFocusedElement.scrollIntoView();
			}
		}
	}, [ hasMissingCustomDimensions, previousHasMissingCustomDimensions ] );

	if ( hasMissingCustomDimensions === false ) {
		return null;
	}

	const customDimensionMessage = hasAnalytics4EditScope
		? __(
				'The metrics you selected require more data tracking. We will update your Analytics property after saving your selection.',
				'google-site-kit'
		  )
		: __(
				'The metrics you selected require more data tracking. You will be directed to update your Analytics property after saving your selection.',
				'google-site-kit'
		  );

	return (
		<div
			className="googlesitekit-km-selection-panel-notice"
			ref={ noticeRef }
		>
			<p>{ customDimensionMessage }</p>
		</div>
	);
}

export default whenActive( { moduleName: 'analytics-4' } )(
	CustomDimensionsNotice
);
