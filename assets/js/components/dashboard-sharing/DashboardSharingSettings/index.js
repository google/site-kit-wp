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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Module from './Module';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	// PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
} from '../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

export default function DashboardSharingSettings() {
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);

	const shareableModules = useSelect( ( select ) => {
		const modules = select( CORE_MODULES ).getModules();
		const sharedOwnershipModules = select(
			CORE_MODULES
		).getSharedOwnershipModules();
		const manageableModules = select( CORE_USER ).getManageableModules();

		if (
			modules === undefined ||
			manageableModules === undefined ||
			sharedOwnershipModules === undefined
		) {
			return undefined;
		}

		const sharedOwnershipModuleSlugs = Object.keys(
			sharedOwnershipModules
		);

		const user = select( CORE_USER ).getUser();
		return Object.keys( modules )
			.reverse()
			.reduce( ( sortedModules, slug ) => {
				const module = modules[ slug ];

				const hasOwnedModule = module.owner?.id === user?.id;

				if ( ! module.internal && module.connected ) {
					const moduleWithManagement = {
						...module,
						management:
							select( CORE_MODULES ).getSharingManagement(
								slug
							) ?? 'owner',
						sharedOwnershipModule: sharedOwnershipModuleSlugs.includes(
							slug
						),
						hasOwnedModule,
					};

					if (
						hasOwnedModule &&
						manageableModules.includes( slug )
					) {
						return [ moduleWithManagement, ...sortedModules ];
					}
					return [ ...sortedModules, moduleWithManagement ];
				}
				return sortedModules;
			}, [] );
	} );

	// const sortedShareableModules = useSelect( ( select ) => {
	// 	const modules = select( CORE_MODULES ).getModules();

	// 	// return early if modules is not an array
	// 	if ( modules === undefined ) {
	// 		return undefined;
	// 	}
	// 	const userID = select( CORE_USER ).getID();

	// 	const shareableModules1 = Object.values( modules ).filter(
	// 		( module ) => module.shareable
	// 	);

	// 	const owned = [];
	// 	const manageable = [];
	// 	const rest = [];

	// 	for ( module of shareableModules1 ) {
	// 		if ( module.owner?.id === userID ) {
	// 			owned.push( module );
	// 		} else if (
	// 			select( CORE_USER ).hasCapability(
	// 				PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
	// 				module.slug
	// 			)
	// 		) {
	// 			manageable.push( module );
	// 		} else {
	// 			rest.push( module );
	// 		}
	// 	}

	// 	return [ ...owned, ...manageable, ...rest ];
	// }, [] );

	if ( shareableModules === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-dashboard-sharing-settings">
			<header className="googlesitekit-dashboard-sharing-settings__header googlesitekit-dashboard-sharing-settings__row">
				<div className="googlesitekit-dashboard-sharing-settings__column--product">
					{ __( 'Product', 'google-site-kit' ) }
				</div>
				<div className="googlesitekit-dashboard-sharing-settings__column--view">
					{ __( 'Who can view', 'google-site-kit' ) }
				</div>

				{ hasMultipleAdmins && (
					<div className="googlesitekit-dashboard-sharing-settings__column--manage">
						{ __(
							'Who can manage view access',
							'google-site-kit'
						) }
					</div>
				) }
			</header>

			<div className="googlesitekit-dashboard-sharing-settings__main">
				{ shareableModules.map(
					( {
						slug,
						name,
						management,
						owner,
						sharedOwnershipModule,
						hasOwnedModule,
					} ) => (
						<Module
							key={ slug }
							moduleSlug={ slug }
							moduleName={ name }
							management={ management }
							ownerUsername={ owner?.login }
							sharedOwnershipModule={ sharedOwnershipModule }
							hasOwnedModule={ hasOwnedModule }
						/>
					)
				) }
			</div>
		</div>
	);
}
