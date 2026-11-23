/**
 * `core/feature-discovery` data store: utils tests.
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
	getFeatureDismissalKey,
	getFeatureIncompleteSetupReminderKey,
	getFeatureNewnessKey,
	isFeatureIncompleteSetupReminderKey,
} from './utils';

describe( 'core/feature-discovery utils', () => {
	describe( 'isFeatureIncompleteSetupReminderKey', () => {
		it.each( [ 'test-feature', 'another_feature', 'feature-123' ] )(
			'should return true for the incomplete setup reminder key of feature "%s"',
			( slug ) => {
				expect(
					isFeatureIncompleteSetupReminderKey(
						getFeatureIncompleteSetupReminderKey( slug )
					)
				).toBe( true );
			}
		);

		it.each( [
			[ 'a feature dismissal key', getFeatureDismissalKey( 'test' ) ],
			[ 'a feature newness key', getFeatureNewnessKey( 'test' ) ],
			[ 'an unrelated key', 'some-other-key' ],
			[ 'an empty string', '' ],
			[
				'a key with the prefix not at the start',
				`prefix-${ getFeatureIncompleteSetupReminderKey( 'test' ) }`,
			],
		] )( 'should return false for %s', ( _, key ) => {
			expect( isFeatureIncompleteSetupReminderKey( key ) ).toBe( false );
		} );
	} );
} );
