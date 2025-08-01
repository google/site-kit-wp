/**
 * Navigation helpers.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_MONETIZATION,
} from '../../../googlesitekit/constants';

export function getDefaultChipID( {
	showKeyMetrics,
	showTraffic,
	showContent,
	showSpeed,
	showMonetization,
	viewOnlyDashboard,
} ) {
	if ( showKeyMetrics ) {
		return ANCHOR_ID_KEY_METRICS;
	}
	if ( ! viewOnlyDashboard ) {
		return ANCHOR_ID_TRAFFIC;
	}
	if ( showTraffic ) {
		return ANCHOR_ID_TRAFFIC;
	}
	if ( showContent ) {
		return ANCHOR_ID_CONTENT;
	}
	if ( showSpeed ) {
		return ANCHOR_ID_SPEED;
	}
	if ( showMonetization ) {
		return ANCHOR_ID_MONETIZATION;
	}
	return '';
}

export function isValidChipID( {
	showKeyMetrics,
	showTraffic,
	showContent,
	showSpeed,
	showMonetization,
} ) {
	const validIDs = new Set();
	if ( showKeyMetrics ) {
		validIDs.add( ANCHOR_ID_KEY_METRICS );
	}
	if ( showTraffic ) {
		validIDs.add( ANCHOR_ID_TRAFFIC );
	}
	if ( showContent ) {
		validIDs.add( ANCHOR_ID_CONTENT );
	}
	if ( showSpeed ) {
		validIDs.add( ANCHOR_ID_SPEED );
	}
	if ( showMonetization ) {
		validIDs.add( ANCHOR_ID_MONETIZATION );
	}

	return ( chipID ) => validIDs.has( chipID );
}
