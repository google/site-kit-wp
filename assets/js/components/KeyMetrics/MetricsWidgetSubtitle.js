/**
 * MetricsWidgetSubtitle component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { useSelect } from 'googlesitekit-data';

export default function MetricsWidgetSubtitle() {
	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	if ( ! isKeyMetricsSetupCompleted ) {
		return null;
	}

	return (
		<Fragment>
			{ __(
				'Track progress towards your goals with tailored metrics and important user interaction metrics',
				'google-site-kit'
			) }
		</Fragment>
	);
}
