/**
 * Ads module intent registration tests.
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
import { createIntents } from '@/js/googlesitekit/intents';
import { AdsConversionTrackingIntent } from '@/js/modules/ads/components/intents';
import { ADS_CONVERSION_TRACKING_INTENT_SLUG } from '@/js/modules/ads/constants';
import { registerIntents } from './index';

describe( 'registerIntents', () => {
	it( 'should register the Ads conversion tracking intent with its component', () => {
		const intents = createIntents();

		registerIntents( intents );

		expect(
			intents.getRegisteredIntent( ADS_CONVERSION_TRACKING_INTENT_SLUG )
				?.Component
		).toBe( AdsConversionTrackingIntent );
	} );
} );
