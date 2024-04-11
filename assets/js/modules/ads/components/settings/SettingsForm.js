/**
 * SettingsForm component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADS } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { TYPE_INFO } from '../../../../components/SettingsNotice';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';
import { ConversionIDTextField } from '../common';
const { useSelect } = Data;

export default function SettingsForm( { hasModuleAccess } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'ads' )
	);

	const formattedOwnerName = module?.owner?.login
		? `<strong>${ module.owner.login }</strong>`
		: __( 'Another admin', 'google-site-kit' );

	return (
		<div className="googlesitekit-ads-settings-fields">
			<StoreErrorNotices moduleSlug="ads" storeName={ MODULES_ADS } />

			<div className="googlesitekit-setup-module__inputs">
				<ConversionIDTextField
					helperText={ __(
						'The Conversion Tracking ID will help track the performance of ad campaigns for the corresponding account',
						'google-site-kit'
					) }
				/>
			</div>

			{ hasModuleAccess === false && (
				<SettingsNotice
					type={ TYPE_INFO }
					Icon={ WarningIcon }
					notice={ createInterpolateElement(
						sprintf(
							/* translators: 1: module owner's name, 2: module name */
							__(
								'%1$s configured %2$s and you don’t have access to it. Contact them to share access.',
								'google-site-kit'
							),
							formattedOwnerName,
							module?.name
						),
						{
							strong: <strong />,
						}
					) }
				/>
			) }

			{ hasModuleAccess && <EntityOwnershipChangeNotice slug="ads" /> }
		</div>
	);
}
