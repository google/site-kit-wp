/**
 * SettingsCardVisitorGroups SetupSuccess component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import useViewContext from '../../../../../../../hooks/useViewContext';
import withIntersectionObserver from '../../../../../../../util/withIntersectionObserver';
import { trackEvent } from '../../../../../../../util';
import SetupSuccessContent from './SetupSuccessContent';

const SetupSuccessContentWithIntersectionObserver =
	withIntersectionObserver( SetupSuccessContent );

export const SHOW_SETTINGS_VISITOR_GROUPS_SUCCESS_NOTIFICATION =
	'showSetupSuccess';

export default function SetupSuccess() {
	const viewContext = useViewContext();

	return (
		<SetupSuccessContentWithIntersectionObserver
			onInView={ () => {
				trackEvent(
					`${ viewContext }_audiences-setup-cta-settings-success`,
					'view_notification'
				);
			} }
		/>
	);
}
