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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Switch } from 'googlesitekit-components';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS, FORM_SETUP } from '../../datastore/constants';
import { ProfileSelect, PropertySelect } from '../common';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
const { useSelect, useDispatch } = Data;

export default function EnableUniversalAnalytics( { children } ) {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const properties = useSelect( ( select ) => {
		if ( ! accountID ) {
			return [];
		}

		return select( MODULES_ANALYTICS ).getProperties( accountID ) || [];
	} );

	const { setValues } = useDispatch( CORE_FORMS );

	const isUAEnabled = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableUA' )
	);

	const viewContext = useViewContext();

	const onChange = useCallback( () => {
		setValues( FORM_SETUP, { enableUA: ! isUAEnabled } );

		trackEvent( `${ viewContext }_analytics`, 'enable_ua' );
	}, [ setValues, isUAEnabled, viewContext ] );

	if ( properties.length === 0 ) {
		return null;
	}

	return (
		<Fragment>
			<div className="googlesitekit-analytics-usesnippet">
				<Switch
					label={ __(
						'Enable Universal Analytics',
						'google-site-kit'
					) }
					checked={ isUAEnabled }
					onClick={ onChange }
					hideLabel={ false }
					disabled={ false }
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
						<PropertySelect />
						<ProfileSelect />
					</div>

					{ /* Renders the SetupUseSnippetSwitch or SettingsUseSnippetSwitch */ }
					{ children }
				</Fragment>
			) }
		</Fragment>
	);
}

EnableUniversalAnalytics.propTypes = {
	children: PropTypes.node.isRequired,
};
