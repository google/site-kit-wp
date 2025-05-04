/**
 * CurrentSurveyPortal component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import CurrentSurvey from './CurrentSurvey';
import Portal from '../Portal';

export default function CurrentSurveyPortal() {
	const currentSurvey = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy() &&
		select( CORE_USER ).areSurveysOnCooldown() === false
			? select( CORE_USER ).getCurrentSurvey()
			: null
	);

	if ( ! currentSurvey ) {
		return null;
	}

	return (
		<Portal slug="survey">
			<CurrentSurvey />
		</Portal>
	);
}
