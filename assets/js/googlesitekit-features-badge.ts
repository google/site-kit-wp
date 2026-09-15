/**
 * Global admin features badge entry point.
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
 * Internal dependencies
 */
import {
	FEATURE_COUNT_CHANNEL_MESSAGES,
	FEATURE_COUNT_CHANNEL_NAME,
	clearFeatureCountCache,
	renderFeaturesBadgeFromCache,
} from '@/js/util/features-badge';

const { connectedModules, pluginVersion, resetSession, userID } =
	global._googlesitekitFeaturesBadgeData;

function onMessage( event: MessageEvent ) {
	if ( event.data === FEATURE_COUNT_CHANNEL_MESSAGES.UPDATED ) {
		renderFeaturesBadgeFromCache( {
			connectedModules,
			pluginVersion,
			userID,
		} );
	}
}

function setupFeaturesBadge() {
	try {
		const featureCountChannel = new BroadcastChannel(
			FEATURE_COUNT_CHANNEL_NAME
		);

		featureCountChannel.addEventListener( 'message', onMessage );
	} catch ( error ) {
		global.console.warn(
			'Encountered an unexpected broadcast channel error:',
			error
		);
	}

	if ( resetSession ) {
		clearFeatureCountCache();
	}

	renderFeaturesBadgeFromCache( { connectedModules, pluginVersion, userID } );
}

setupFeaturesBadge();
