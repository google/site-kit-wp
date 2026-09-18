/**
 * Feature count cache hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { setFeatureCountCache } from '@/js/util/features-badge';

/**
 * Keeps the menu badge cache up to date as feature newness changes.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export default function useFeatureCountCache(): void {
	const featureDiscoveryHubEnabled = useFeature( 'featureDiscoveryHub' );

	const hasCapability: boolean | undefined = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ),
		[]
	);

	const showBadge = featureDiscoveryHubEnabled && hasCapability;

	const count: number | undefined = useSelect(
		( select: Select ) =>
			showBadge
				? select( CORE_FEATURE_DISCOVERY ).getNewFeatureCount()
				: undefined,
		[ showBadge ]
	);

	const modules: Record< string, object > | undefined = useSelect(
		( select: Select ) =>
			showBadge ? select( CORE_MODULES ).getModules() : undefined,
		[ showBadge ]
	);

	const connectedModules: string[] | undefined = useSelect(
		( select: Select ) =>
			modules
				? Object.keys( modules ).filter( ( slug ) =>
						select( CORE_MODULES ).isModuleConnected( slug )
				  )
				: undefined,
		[ modules ]
	);

	const pluginVersion = global.GOOGLESITEKIT_VERSION;

	const userID: number | undefined = useSelect(
		( select: Select ) =>
			showBadge ? select( CORE_USER ).getID() : undefined,
		[ showBadge ]
	);

	useEffect( () => {
		if (
			connectedModules !== undefined &&
			count !== undefined &&
			userID !== undefined
		) {
			setFeatureCountCache( {
				connectedModules,
				count,
				pluginVersion,
				userID,
			} );
		}
	}, [ connectedModules, count, pluginVersion, userID ] );
}
