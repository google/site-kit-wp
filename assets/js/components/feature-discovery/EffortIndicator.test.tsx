/**
 * EffortIndicator component tests.
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
 * External dependencies
 */
import { SVGProps } from 'react';

/**
 * Internal dependencies
 */
import { FEATURE_EFFORTS } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { render } from '@tests/js/test-utils';
import EffortIndicator from './EffortIndicator';

jest.mock(
	'@/svg/icons/wrench.svg',
	() => ( props: SVGProps< SVGSVGElement > ) => <svg { ...props } />
);

describe( 'EffortIndicator', () => {
	it.each( [
		[ 'Just a few clicks', FEATURE_EFFORTS.LOW, 2 ],
		[ 'A short setup', FEATURE_EFFORTS.MEDIUM, 1 ],
		[ 'In depth setup', FEATURE_EFFORTS.HIGH, 0 ],
	] as const )(
		'should display "%s" for effort %s, with %s/3 inactive icons',
		( label, effort, inactiveIconCount ) => {
			const { container, getByText } = render(
				<EffortIndicator effort={ effort } />
			);

			expect( getByText( label ) ).toBeInTheDocument();

			expect(
				container.querySelectorAll(
					'.googlesitekit-effort-indicator__icon'
				)
			).toHaveLength( 3 );

			expect(
				container.querySelectorAll(
					'.googlesitekit-effort-indicator__icon--inactive'
				)
			).toHaveLength( inactiveIconCount );
		}
	);
} );
