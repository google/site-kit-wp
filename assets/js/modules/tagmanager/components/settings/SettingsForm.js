/**
 * Tag Manager Settings Form component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	AccountSelect,
	AMPContainerSelect,
	ContainerNames,
	FormInstructions,
	TagCheckProgress,
	WebContainerSelect,
} from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import SettingsUseSnippetSwitch from './SettingsUseSnippetSwitch';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { TYPE_INFO } from '../../../../components/SettingsNotice';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';

export default function SettingsForm( { hasModuleAccess } ) {
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'tagmanager' )
	);

	const formattedOwnerName = module?.owner?.login
		? `<strong>${ module.owner.login }</strong>`
		: __( 'Another admin', 'google-site-kit' );

	return (
		<div className="googlesitekit-tagmanager-settings-fields">
			<StoreErrorNotices
				moduleSlug="tagmanager"
				storeName={ MODULES_TAGMANAGER }
			/>
			<FormInstructions />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect hasModuleAccess={ hasModuleAccess } />

				<WebContainerSelect hasModuleAccess={ hasModuleAccess } />

				<AMPContainerSelect hasModuleAccess={ hasModuleAccess } />

				<TagCheckProgress />
			</div>

			{ hasModuleAccess === false && (
				<SettingsNotice
					type={ TYPE_INFO }
					Icon={ WarningIcon }
					notice={ createInterpolateElement(
						sprintf(
							/* translators: 1: module owner's name, 2: module name */
							__(
								'%1$s configured %2$s and you don’t have access to this %2$s account. Contact them to share access or change the %2$s account.',
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

			<ContainerNames />

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<SettingsUseSnippetSwitch />
			</div>
		</div>
	);
}

SettingsForm.propTypes = {
	hasModuleAccess: PropTypes.bool,
};

SettingsForm.defaultProps = {
	hasModuleAccess: true,
};
