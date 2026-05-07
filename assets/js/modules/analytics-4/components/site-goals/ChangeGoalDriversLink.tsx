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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { SITE_GOALS_SELECTION_PANEL_OPENED_KEY } from '@/js/modules/analytics-4/components/site-goals/constants';
import PencilIcon from '@/svg/icons/pencil-alt.svg';

interface ChangeGoalDriversLinkProps {
	className?: string;
}

export default function ChangeGoalDriversLink( {
	className,
}: ChangeGoalDriversLinkProps ) {
	const { setValue } = useDispatch( CORE_UI );

	return (
		<Link
			className={ classnames(
				'googlesitekit-site-goals-change-drivers-cta',
				className
			) }
			onClick={ () =>
				setValue( SITE_GOALS_SELECTION_PANEL_OPENED_KEY, true )
			}
			leadingIcon={ <PencilIcon width={ 18 } height={ 18 } /> }
			secondary
			linkButton
		>
			{ __( 'Select metrics', 'google-site-kit' ) }
		</Link>
	);
}
