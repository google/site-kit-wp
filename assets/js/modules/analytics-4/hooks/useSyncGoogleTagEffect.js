/**
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
import { useMount } from 'react-use';

/**
 * Internal dependencies
 */
import { useDispatch } from '../../../googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';

export default function useSyncGoogleTagEffect() {
	const { syncGoogleTagSettings } = useDispatch( MODULES_ANALYTICS_4 );

	useMount( () => {
		// The sync action has its own guards internally,
		// so it's safe to use uncondionally here.
		syncGoogleTagSettings();
	} );

	return null;
}
