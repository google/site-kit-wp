/**
 * Site Goals ChangeGoalDriversLink component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { SITE_GOALS_SELECTION_PANEL_OPENED_KEY } from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { trackEvent } from '@/js/util';
import PencilIcon from '@/svg/icons/pencil-alt.svg';

interface ChangeGoalDriversLinkProps {
	className?: string;
	goalType: GoalType;
}

export default function ChangeGoalDriversLink( {
	className,
	goalType,
}: ChangeGoalDriversLinkProps ) {
	const { setValue } = useDispatch( CORE_UI );
	const viewContext = useViewContext();

	return (
		<Link
			className={ classnames(
				'googlesitekit-site-goals-change-drivers-cta',
				className
			) }
			onClick={ () => {
				trackEvent(
					`${ viewContext }_site-goals-sidebar`,
					'change_goal_drivers',
					goalType
				);
				setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, true );
			} }
			leadingIcon={ <PencilIcon width={ 20 } height={ 20 } /> }
			secondary
			linkButton
		>
			{ __( 'Select metrics', 'google-site-kit' ) }
		</Link>
	);
}
