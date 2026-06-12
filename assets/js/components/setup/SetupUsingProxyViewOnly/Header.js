/**
 * Header component for SetupUsingProxyViewOnly.
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
import MainHeader from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import ExitSetup from '@/js/components/setup/ExitSetup';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';

export default function Header() {
	const setupFlowRefreshPhase4Enabled = useFeature(
		'setupFlowRefreshPhase4'
	);
	const viewContext = useViewContext();

	return (
		<MainHeader>
			{ setupFlowRefreshPhase4Enabled ? (
				<ExitSetup
					gaTrackingEventArgs={ {
						category: viewContext,
						label: 'splash',
					} }
				/>
			) : (
				<HelpMenu />
			) }
		</MainHeader>
	);
}
