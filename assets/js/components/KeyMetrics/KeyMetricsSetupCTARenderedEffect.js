/**
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
import { useEffectOnce } from 'react-use';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export const UI_KEY_KEY_METRICS_SETUP_CTA_RENDERED =
	'KEY_METRICS_SETUP_CTA_RENDERED';

export default function KeyMetricsSetupCTARenderedEffect() {
	const { setValue } = useDispatch( CORE_UI );

	useEffectOnce( () => {
		setValue( UI_KEY_KEY_METRICS_SETUP_CTA_RENDERED, true );
	} );

	return null;
}
