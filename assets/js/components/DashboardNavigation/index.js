/**
 * DashboardNavigation component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../hooks/useViewOnly';
import LoadingWrapper from '../LoadingWrapper';
import Navigation from './Navigation';
import { useFeature } from '../../hooks/useFeature';
const { useSelect } = Data;

export default function DashboardNavigation() {
	const viewOnlyDashboard = useViewOnly();

	const viewableModules = useSelect( ( select ) => {
		if ( ! viewOnlyDashboard ) {
			return null;
		}

		return select( CORE_USER ).getViewableModules();
	} );

	const keyMetricsEnabled = useFeature( 'keyMetrics' );

	const keyMetrics = useSelect(
		( select ) => keyMetricsEnabled && select( CORE_USER ).getKeyMetrics()
	);

	// The Navigation component relies on the resolution of the above selectors to check if individual
	// widgetContexts are active. The results of these checks are used to determine the `defaultChipID`
	// which 'highlights' the first chip and sets the corresponding hash on page load.
	return (
		<LoadingWrapper
			loading={
				viewableModules === undefined || keyMetrics === undefined
			}
			width="100%"
			smallHeight="59px"
			height="71px"
		>
			<Navigation />
		</LoadingWrapper>
	);
}
