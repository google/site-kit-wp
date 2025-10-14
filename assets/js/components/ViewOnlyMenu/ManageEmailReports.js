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
import { useDispatch } from '@/js/googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import ManageEmailReportsIcon from '@/svg/icons/manage-email-reports.svg';
import { Button } from 'googlesitekit-components';

export default function ManageEmailReports() {
	const { setValue } = useDispatch( CORE_UI );

	return (
		<Fragment>
			<li className="mdc-list-divider" role="separator"></li>
			<li className="googlesitekit-view-only-menu__list-item googlesitekit-view-only-menu__email-reporting">
				<ul className="googlesitekit-view-only-menu">
					<li className="googlesitekit-view-only-menu__email-reporting-item">
						<Button
							onClick={ () =>
								setValue(
									USER_SETTINGS_SELECTION_PANEL_OPENED_KEY,
									true
								)
							}
							icon={
								<span className="googlesitekit-view-only-menu__email-reporting-item--icon">
									<ManageEmailReportsIcon width="24" />
								</span>
							}
							tertiary
						>
							<span className="googlesitekit-view-only-menu__email-reporting-item--name">
								{ __(
									'Manage email reports',
									'google-site-kit'
								) }
							</span>
						</Button>
					</li>
				</ul>
			</li>
		</Fragment>
	);
}
