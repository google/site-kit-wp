/**
 * `useIsInitialSetupFlow` hook.
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
import { useFeature } from '@/js/hooks/useFeature';
import useQueryArg from '@/js/hooks/useQueryArg';

/**
 * Determines whether the current screen was reached from the refreshed initial setup flow.
 *
 * The flow marks its screens with a `showProgress` query arg, and only exists
 * when the `setupFlowRefresh` feature is enabled.
 *
 * @since n.e.x.t
 *
 * @return {boolean} TRUE when the screen is part of the initial setup flow, otherwise FALSE.
 */
export default function useIsInitialSetupFlow(): boolean {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const [ showProgress ] = useQueryArg( 'showProgress' );

	return !! setupFlowRefreshEnabled && showProgress === 'true';
}
