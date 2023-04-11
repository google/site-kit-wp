/**
 * Enable Universal Analytics component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Fragment,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS, FORM_SETUP } from '../../datastore/constants';
import { TYPE_INFO } from '../../../../components/SettingsNotice';
import ProfileSelect from './ProfileSelect';
import PropertySelect from './PropertySelect';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';
const { useSelect, useDispatch } = Data;

export default function EnableUniversalAnalytics( {
	children,
	hasModuleAccess = true,
} ) {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const properties = useSelect( ( select ) => {
		if ( ! accountID ) {
			return [];
		}

		return select( MODULES_ANALYTICS ).getProperties( accountID ) || [];
	} );
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const isUAEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableUA' )
	);
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'analytics' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { resetPropertyAndProfileIDs, revertPropertyAndProfileIDs } =
		useDispatch( MODULES_ANALYTICS );

	const onChange = useCallback( () => {
		if ( isUAEnabled ) {
			resetPropertyAndProfileIDs();
		} else {
			revertPropertyAndProfileIDs();
		}

		setValues( FORM_SETUP, { enableUA: ! isUAEnabled } );
	}, [
		isUAEnabled,
		setValues,
		resetPropertyAndProfileIDs,
		revertPropertyAndProfileIDs,
	] );

	const formattedOwnerName = module?.owner?.login
		? `<strong>${ module.owner.login }</strong>`
		: __( 'Another admin', 'google-site-kit' );

	useMount( () => {
		if ( propertyID ) {
			setValues( FORM_SETUP, { enableUA: true } );
		}
	} );

	if ( properties.length === 0 ) {
		return null;
	}

	return (
		<Fragment>
			<div className="googlesitekit-analytics-enable">
				<Switch
					label={ __(
						'Enable Universal Analytics',
						'google-site-kit'
					) }
					checked={ isUAEnabled }
					onClick={ onChange }
					hideLabel={ false }
				/>
				<p>
					{ __(
						'The old version of Analytics, which stops recording data after July 1, 2023',
						'google-site-kit'
					) }
				</p>
			</div>
			{ isUAEnabled && (
				<Fragment>
					<div className="googlesitekit-setup-module__inputs">
						<PropertySelect hasModuleAccess={ hasModuleAccess } />
						<ProfileSelect hasModuleAccess={ hasModuleAccess } />
					</div>

					{ /* Renders the SetupUseSnippetSwitch or SettingsUseSnippetSwitch */ }
					{ children }

					{ hasModuleAccess === false && (
						<SettingsNotice
							type={ TYPE_INFO }
							Icon={ WarningIcon }
							notice={ createInterpolateElement(
								sprintf(
									/* translators: 1: module owner's name, 2: module name */
									__(
										'%1$s configured %2$s and you don’t have access to its configured property. Contact them to share access or change the configured property.',
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
				</Fragment>
			) }
		</Fragment>
	);
}

EnableUniversalAnalytics.propTypes = {
	children: PropTypes.node.isRequired,
	hasModuleAccess: PropTypes.bool,
};
