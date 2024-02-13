/**
 * AccountField component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CreateAccountField from './CreateAccountField';
import Data from 'googlesitekit-data';
import { FORM_ACCOUNT_CREATE } from '../../../datastore/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';

const { useSelect, useDispatch } = Data;

export default function AccountField() {
	const value = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_ACCOUNT_CREATE, 'accountName' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const setValue = useCallback(
		( accountName ) => {
			setValues( FORM_ACCOUNT_CREATE, { accountName } );
		},
		[ setValues ]
	);

	return (
		<CreateAccountField
			label={ __( 'Account', 'google-site-kit' ) }
			hasError={ ! value }
			value={ value }
			setValue={ setValue }
			name="account"
		/>
	);
}
