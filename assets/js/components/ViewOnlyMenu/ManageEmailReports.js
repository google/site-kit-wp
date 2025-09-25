/**
 * ViewOnlyMenu > ManageEmailReports component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageEmailReportsIcon from '@/svg/icons/manage-email-reports.svg';

export default function ManageEmailReports() {
	return (
		<Fragment>
			<li className="mdc-list-divider" role="separator"></li>
			<li className="googlesitekit-view-only-menu__list-item">
				<ul className="googlesitekit-view-only-menu">
					<li className="googlesitekit-view-only-menu__service googlesitekit-view-only-menu__service--standard-item">
						<span className="googlesitekit-view-only-menu__service--icon">
							<ManageEmailReportsIcon width="24" />
						</span>
						<span className="googlesitekit-view-only-menu__service--name">
							{ __( 'Manage email reports', 'google-site-kit' ) }
						</span>
					</li>
				</ul>
			</li>
		</Fragment>
	);
}
