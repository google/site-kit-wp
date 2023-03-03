/**
 * SetupModule component.
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

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import useViewOnly from '../../hooks/useViewOnly';

const { useSelect, useDispatch } = Data;

export default function SettingsKeyMetrics() {
	const dashboardSharingEnabled = useFeature( 'dashboardSharing' );
	const viewOnly = useViewOnly();

	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	const keyMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getKeyMetrics()
	);

	const { setKeyMetricSetting, saveKeyMetrics } = useDispatch( CORE_USER );

	const handleKeyMatricsToggle = useCallback( async () => {
		await setKeyMetricSetting(
			'isWidgetHidden',
			! keyMetrics?.isWidgetHidden
		);
		await saveKeyMetrics();
	}, [ keyMetrics, saveKeyMetrics, setKeyMetricSetting ] );

	if ( ! ( isAuthenticated || ( dashboardSharingEnabled && viewOnly ) ) ) {
		return null;
	}

	return (
		<Switch
			label={ __(
				'Display key metrics in dashboard',
				'google-site-kit'
			) }
			checked={ ! keyMetrics?.isWidgetHidden }
			onClick={ handleKeyMatricsToggle }
			hideLabel={ false }
		/>
	);
}
