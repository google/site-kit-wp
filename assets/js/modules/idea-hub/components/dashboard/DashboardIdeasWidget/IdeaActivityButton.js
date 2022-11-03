/**
 * IdeaActivityButton component
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import {
	classNamesMap,
	titlesMap,
	progressMap,
	activityIconMap,
} from './utils';
import {
	MODULES_IDEA_HUB,
	IDEA_HUB_BUTTON_VIEW,
} from '../../../datastore/constants';
import { CircularProgress } from '../../../../../material-components';
import Null from '../../../../../components/Null';
import useViewOnly from '../../../../../hooks/useViewOnly';

const { useSelect } = Data;

export default function IdeaActivityButton( {
	activity,
	children,
	href,
	name,
	onClick,
} ) {
	const currentActivity = useSelect( ( select ) =>
		select( MODULES_IDEA_HUB ).getActivity( name )
	);

	// Hide action buttons if the user has view-only version of the dashboard.
	const viewOnlyDashboard = useViewOnly();
	if ( viewOnlyDashboard && activity !== IDEA_HUB_BUTTON_VIEW ) {
		return null;
	}

	const inProgress =
		activity === IDEA_HUB_BUTTON_VIEW
			? !! currentActivity
			: currentActivity === progressMap[ activity ];
	const ActivityIcon = activityIconMap[ activity ] || Null;

	return (
		<Button
			className={ classNamesMap[ activity ] || undefined }
			onClick={ onClick }
			disabled={ inProgress }
			href={ href || undefined }
			icon={
				inProgress ? (
					<CircularProgress size={ 24 } />
				) : (
					<ActivityIcon width={ 24 } height={ 24 } />
				)
			}
			title={ titlesMap[ activity ] }
		>
			{ children }
		</Button>
	);
}

IdeaActivityButton.propTypes = {
	activity: PropTypes.string.isRequired,
	children: PropTypes.node,
	href: PropTypes.string,
	name: PropTypes.string.isRequired,
	onClick: PropTypes.func.isRequired,
};
