/**
 * Reader Revenue Manager pre-existing CTAs hook.
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
import { type Select, useSelect } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Determines whether the connected publication had CTAs before the one that
 * was just created in this setup flow.
 *
 * The CTA created during setup is itself part of the configured CTAs, so the
 * publication had pre-existing CTAs when more than one is configured.
 *
 * @since n.e.x.t
 *
 * @return {(boolean|undefined)} `true` when there are pre-existing CTAs, `false` when
 *                               there are none, `undefined` while the CTAs are loading.
 */
export default function useHasPreExistingCTAs(): boolean | undefined {
	const ctas = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getCTAs(),
		[]
	);

	if ( ctas === undefined ) {
		return undefined;
	}

	return ctas.length > 1;
}
