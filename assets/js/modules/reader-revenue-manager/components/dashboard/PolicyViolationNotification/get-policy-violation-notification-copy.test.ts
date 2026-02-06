/**
 * Get notification copy utility tests.
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
import { TYPES } from '@/js/components/Notice/constants';
import { CONTENT_POLICY_STATES } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { getPolicyViolationNotificationCopy } from './get-policy-violation-notification-copy';

const {
	CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD,
	CONTENT_POLICY_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE,
	CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE,
} = CONTENT_POLICY_STATES;

describe( 'getPolicyViolationNotificationCopy', () => {
	it( 'should return the correct copy for content policy state `CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE`', () => {
		const result = getPolicyViolationNotificationCopy(
			CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE_IMMEDIATE
		);

		expect( result ).toEqual( {
			type: TYPES.ERROR,
			title: 'Action needed: Your Reader Revenue Manager account is terminated',
			description:
				'Your account is terminated because your site content doesn’t follow the rules. Visit Publisher Center for more information.',
			ctaLabel: 'Learn more',
		} );
	} );

	it.each( [
		[ CONTENT_POLICY_VIOLATION_ACTIVE ],
		[ CONTENT_POLICY_ORGANIZATION_VIOLATION_ACTIVE ],
	] )(
		'should return the correct copy for content policy state %s',
		( contentPolicyState ) => {
			const result =
				getPolicyViolationNotificationCopy( contentPolicyState );

			expect( result ).toEqual( {
				type: TYPES.WARNING,
				title: 'Action needed: Your Reader Revenue Manager account is restricted',
				description:
					'Your site has content that doesn’t follow the rules. To see more details and resolve the violation, please visit Publisher Center.',
				ctaLabel: 'View violations',
			} );
		}
	);

	it.each( [
		[ CONTENT_POLICY_VIOLATION_GRACE_PERIOD ],
		[ CONTENT_POLICY_ORGANIZATION_VIOLATION_GRACE_PERIOD ],
	] )(
		'should return the correct copy for content policy state %s',
		( contentPolicyState ) => {
			const result =
				getPolicyViolationNotificationCopy( contentPolicyState );

			expect( result ).toEqual( {
				type: TYPES.WARNING,
				title: 'Action needed: fix a policy issue with Reader Revenue Manager',
				description:
					'Your site has content that breaks the rules for Reader Revenue Manager. To keep your account active and CTAs public, you must resolve all policy violations.',
				ctaLabel: 'View violations',
			} );
		}
	);
} );
