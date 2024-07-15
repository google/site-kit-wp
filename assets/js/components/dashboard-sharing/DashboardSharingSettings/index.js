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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Module from './Module';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
} from '../../../googlesitekit/datastore/user/constants';

export default function DashboardSharingSettings() {
	const hasRecoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).hasRecoverableModules()
	);

	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);

	const showManageColumn = hasRecoverableModules || hasMultipleAdmins;

	const sortedShareableModules = useSelect( ( select ) => {
		const userID = select( CORE_USER ).getID();
		const shareableModules = select( CORE_MODULES ).getShareableModules();

		const owned = [];
		const manageable = [];
		const rest = [];

		for ( module of Object.values( shareableModules ) ) {
			if ( module.owner?.id === userID ) {
				owned.push( module );
			} else if (
				select( CORE_USER ).hasCapability(
					PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
					module.slug
				)
			) {
				manageable.push( module );
			} else {
				rest.push( module );
			}
		}

		return [ ...owned, ...manageable, ...rest ];
	} );

	if ( sortedShareableModules === undefined ) {
		return null;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-dashboard-sharing-settings',
				{
					'googlesitekit-dashboard-sharing-settings--has-multiple-admins':
						showManageColumn,
				}
			) }
		>
			<header className="googlesitekit-dashboard-sharing-settings__header googlesitekit-dashboard-sharing-settings__row">
				<div className="googlesitekit-dashboard-sharing-settings__column--product">
					{ __( 'Product', 'google-site-kit' ) }
				</div>
				<div className="googlesitekit-dashboard-sharing-settings__column--view">
					{ __( 'Who can view', 'google-site-kit' ) }
				</div>

				{ showManageColumn && (
					<div className="googlesitekit-dashboard-sharing-settings__column--manage">
						{ __(
							'Who can manage view access',
							'google-site-kit'
						) }
					</div>
				) }
			</header>

			<div className="googlesitekit-dashboard-sharing-settings__main">
				{ sortedShareableModules.map(
					( { slug, name, owner, recoverable } ) => (
						<Module
							key={ slug }
							moduleSlug={ slug }
							moduleName={ name }
							ownerUsername={ owner?.login }
							recoverable={ recoverable }
						/>
					)
				) }
			</div>
		</div>
	);
}
