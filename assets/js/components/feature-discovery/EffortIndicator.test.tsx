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
 * Internal dependencies
 */
import { FEATURE_EFFORTS } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { render, screen } from '@tests/js/test-utils';
import EffortIndicator from './EffortIndicator';

describe( 'EffortIndicator', () => {
	it.each( [
		[ FEATURE_EFFORTS.LOW, 'Just a few clicks', 1 ],
		[ FEATURE_EFFORTS.MEDIUM, 'A short setup', 2 ],
		[ FEATURE_EFFORTS.HIGH, 'In depth setup', 3 ],
	] as const )(
		'should render the label and filled icon count for effort %s',
		( effort, label, filledIconCount ) => {
			const { container } = render(
				<EffortIndicator effort={ effort } />
			);

			expect( screen.getByText( label ) ).toBeInTheDocument();
			expect(
				container.querySelectorAll(
					'.googlesitekit-effort-indicator__icon'
				)
			).toHaveLength( 3 );
			expect(
				container.querySelectorAll(
					'.googlesitekit-effort-indicator__icon--filled'
				)
			).toHaveLength( filledIconCount );
			expect(
				container.querySelector(
					'.googlesitekit-effort-indicator__icons'
				)
			).toHaveAttribute( 'aria-hidden', 'true' );
		}
	);
} );
