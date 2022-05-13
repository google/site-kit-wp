/**
 * DashboardSharingSettings component.
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
 * External dependencies
 */
import { Tooltip } from '@material-ui/core';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { Icon, info } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ModuleIcon from '../../ModuleIcon';
// import { PERMISSION_MANAGE_MODULE_SHARING_OPTIONS } from '../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
// import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { Select, Option } from '../../../material-components';
const { useSelect } = Data;

export default function DashboardSharingSettings() {
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);
	// const hasMultipleAdmins = useSelect( ( select ) =>
	// 	select( CORE_SITE ).hasMultipleAdmins()
	// );

	if ( modules === undefined ) {
		return null;
	}

	const activeModules = Object.keys( modules )
		.map( ( slug ) => modules[ slug ] )
		.filter( ( { internal, active } ) => ! internal && active )
		.sort( ( a, b ) => a.order - b.order );

	return (
		<div className="googlesitekit-dashboard-sharing-settings">
			<header className="googlesitekit-dashboard-sharing-settings__header googlesitekit-dashboard-sharing-settings__row">
				<div className="googlesitekit-dashboard-sharing-settings__column--product">
					{ __( 'Product', 'google-site-kit' ) }
				</div>
				<div className="googlesitekit-dashboard-sharing-settings__column--view">
					{ __( 'Who can view', 'google-site-kit' ) }
				</div>
				<div className="googlesitekit-dashboard-sharing-settings__column--manage">
					{ __( 'Who can manage view access', 'google-site-kit' ) }
				</div>
			</header>

			<div className="googlesitekit-dashboard-sharing-settings__main">
				{ activeModules.map( ( { slug, name } ) => (
					<div
						className="googlesitekit-dashboard-sharing-settings__module googlesitekit-dashboard-sharing-settings__row"
						key={ slug }
					>
						<div className="googlesitekit-dashboard-sharing-settings__column--product">
							<ModuleIcon slug={ slug } size={ 28 } />

							<span className="googlesitekit-dashboard-sharing-settings__module-name">
								{ name }
							</span>
						</div>

						<div className="googlesitekit-dashboard-sharing-settings__column--view">
							<p className="googlesitekit-dashboard-sharing-settings__note">
								{ __(
									'Contact managing user to manage view access',
									'google-site-kit'
								) }
							</p>
						</div>
						<div className="googlesitekit-dashboard-sharing-settings__column--manage">
							<Select
								className="googlesitekit-dashboard-sharing-settings__select"
								enhanced
								outlined
							>
								<Option value="only-me">
									{ __( 'Only me', 'google-site-kit' ) }
								</Option>
								<Option value="only-you">
									{ __( 'Only you', 'google-site-kit' ) }
								</Option>
							</Select>
						</div>
					</div>
				) ) }

				{ /* @TODO: To remove afterwards. Static content for styling purposes. */ }
				<div className="googlesitekit-dashboard-sharing-settings__module googlesitekit-dashboard-sharing-settings__row">
					<div className="googlesitekit-dashboard-sharing-settings__column--product">
						<ModuleIcon slug="analytics" size={ 28 } />

						<span className="googlesitekit-dashboard-sharing-settings__module-name">
							Analytics
						</span>
					</div>

					<div className="googlesitekit-dashboard-sharing-settings__column--view">
						<p className="googlesitekit-dashboard-sharing-settings__note">
							{ __(
								'Contact managing user to manage view access',
								'google-site-kit'
							) }
						</p>
					</div>
					<div className="googlesitekit-dashboard-sharing-settings__column--manage"></div>
				</div>
				<div className="googlesitekit-dashboard-sharing-settings__module googlesitekit-dashboard-sharing-settings__row">
					<div className="googlesitekit-dashboard-sharing-settings__column--product">
						<ModuleIcon slug="adsense" size={ 28 } />

						<span className="googlesitekit-dashboard-sharing-settings__module-name">
							AdSense
						</span>
					</div>

					<div className="googlesitekit-dashboard-sharing-settings__column--view">
						<p className="googlesitekit-dashboard-sharing-settings__note">
							{ __(
								'Contact managing user to manage view access',
								'google-site-kit'
							) }
						</p>
					</div>
					<div className="googlesitekit-dashboard-sharing-settings__column--manage">
						<p className="googlesitekit-dashboard-sharing-settings__note">
							{ createInterpolateElement(
								sprintf(
									/* translators: %s: user who manages the module. */
									__(
										'<span>Managed by</span> <strong>%s</strong>',
										'google-site-kit'
									),
									'Admin 1'
								),
								{
									span: <span />,
									strong: <strong />,
								}
							) }

							<Tooltip
								title={ sprintf(
									/* translators: %s: name of the user who manages the module. */
									__(
										'%s has connected this and given managing permissions to all admins. You can change who can view this on the dashboard.',
										'google-site-kit'
									),
									'Admin 1'
								) }
								classes={ {
									popper: 'googlesitekit-tooltip-popper',
									tooltip: 'googlesitekit-tooltip',
								} }
							>
								<span className="googlesitekit-dashboard-sharing-settings__tooltip-icon">
									<Icon icon={ info } size={ 18 } />
								</span>
							</Tooltip>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
