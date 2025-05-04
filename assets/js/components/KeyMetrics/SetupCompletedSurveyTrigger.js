/**
 * Key Metrics SetupCompletedSurveyTrigger component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { WEEK_IN_SECONDS } from '../../util';
import SurveyViewTrigger from '../surveys/SurveyViewTrigger';

export default function SetupCompletedSurveyTrigger() {
	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	const isKeyMetricsSetupCompletedBy = useSelect( ( select ) =>
		select( CORE_SITE ).getKeyMetricsSetupCompletedBy()
	);

	const currentUserID = useSelect( ( select ) =>
		select( CORE_USER ).getID()
	);

	if ( ! isKeyMetricsSetupCompleted ) {
		return null;
	}

	return (
		<Fragment>
			<SurveyViewTrigger triggerID="view_kmw" ttl={ WEEK_IN_SECONDS } />
			{ isKeyMetricsSetupCompletedBy === currentUserID && (
				<SurveyViewTrigger
					triggerID="view_kmw_setup_completed"
					ttl={ WEEK_IN_SECONDS }
				/>
			) }
		</Fragment>
	);
}
