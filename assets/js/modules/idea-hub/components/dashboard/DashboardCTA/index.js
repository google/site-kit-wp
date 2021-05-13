/**
 * DashboardCTA component.
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
 * WordPress dependencies
 */
// import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
// import Data from 'googlesitekit-data';
// import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import Button from '../../../../../components/Button';
import Link from '../../../../../components/Link';
import IdeaHubIcon from '../../../../../../svg/idea-hub.svg';
// const { useSelect, useDispatch } = Data;

function DashboardCTA() {
	// const { connected, active } = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'idea-hub' ) );
	// const { activateModule } = useDispatch( CORE_MODULES );

	// const onClick = useCallback( async () => { } );

	return (
		<div className="_googlesitekit-idea-hub-dashboardcta">
			<div className="_googlesitekit-idea-hub-dashboardcta__icon">
				<IdeaHubIcon width="45" height="84" />
			</div>

			<div className="_googlesitekit-idea-hub-dashboardcta__content">
				<h5>{ __( 'Get new topics based on what people are searching for with Idea Hub', 'google-site-kit' ) }</h5>
				<p>
					<Link
						className="_googlesitekit-idea-hub-dashboardcta__learnmore"
						href="https://sitekit.withgoogle.com/documentation/idea-hub-module/">
						{ __( 'Learn more', 'google-site-kit' ) }
					</Link>
				</p>

				<Button>{ __( 'Set up', 'google-site-kit' ) }</Button>
			</div>
		</div>
	);
}

export default DashboardCTA;
