/**
 * EntityOwnershipChangeNotice component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import SettingsNotice from '../SettingsNotice/SettingsNotice';
import { TYPE_WARNING } from '../SettingsNotice/utils';
import { listFormat } from '../../util';
const { useSelect } = Data;

export default function EntityOwnershipChangeNotice( { slug } ) {
	const isDashboardSharingEnabled = useFeature( 'dashboardSharing' );

	const slugs = Array.isArray( slug ) ? slug : [ slug ];

	const storeNames = useSelect( ( select ) => {
		const { getModuleStoreName, getSharedRoles } = select( CORE_MODULES );

		return (
			slugs
				// Filter out modules that don't have any shared roles.
				.filter( ( currentSlug ) => {
					return !! getSharedRoles( currentSlug )?.length;
				} )
				.reduce( ( acc, currentSlug ) => {
					const storeName = getModuleStoreName( currentSlug );

					if ( storeName ) {
						return { ...acc, [ currentSlug ]: storeName };
					}

					return acc;
				}, {} )
		);
	} );

	const haveOwnedSettingsChanged = useSelect( ( select ) =>
		Object.keys( storeNames ).reduce( ( acc, currentSlug ) => {
			const storeName = storeNames[ currentSlug ];
			const moduleOwnerID = select( storeName )?.getOwnerID();
			const loggedInUserID = select( CORE_USER ).getID();
			const haveSettingsChanged =
				select( storeName )?.haveOwnedSettingsChanged();
			if ( haveSettingsChanged && moduleOwnerID !== loggedInUserID ) {
				acc[ currentSlug ] = haveSettingsChanged;
			}

			return acc;
		}, {} )
	);

	const haveModulesChanged = Object.values( haveOwnedSettingsChanged ).some(
		( hasChanged ) => hasChanged
	);

	const moduleNames = useSelect( ( select ) => {
		return Object.keys( haveOwnedSettingsChanged ).reduce(
			( acc, moduleSlug ) => {
				const module = select( CORE_MODULES ).getModule( moduleSlug );
				if ( module ) {
					acc.push( module.name );
				}
				return acc;
			},
			[]
		);
	} );

	if ( ! isDashboardSharingEnabled || ! haveModulesChanged ) {
		return null;
	}

	return (
		<SettingsNotice
			type={ TYPE_WARNING }
			notice={ sprintf(
				/* translators: %s: module name. */
				__(
					'By clicking confirm changes, you’re granting other users view-only access to data from %s via your Google account. You can always manage this later in the dashboard sharing settings.',
					'google-site-kit'
				),
				listFormat( moduleNames )
			) }
		/>
	);
}

EntityOwnershipChangeNotice.propTypes = {
	slug: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.arrayOf( PropTypes.string ),
	] ).isRequired,
};
