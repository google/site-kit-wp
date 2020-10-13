/**
 * StoreErrorNotice component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorNotice from '../components/ErrorNotice';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { isInsufficientPermissionsError } from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
const { useSelect } = Data;

export default function StoreErrorNotice( { storeName, shouldDisplayError, moduleSlug } ) {
	const error = useSelect( ( select ) => select( storeName ).getError() );
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) );

	if ( isInsufficientPermissionsError( error ) ) {
		error.message = getInsufficientPermissionsErrorDescription( error.message, module );
	}

	return (
		<ErrorNotice
			error={ error }
			shouldDisplayError={ shouldDisplayError }
		/>
	);
}

StoreErrorNotice.propTypes = {
	storeName: PropTypes.string.isRequired,
	shouldDisplayError: PropTypes.func,
	moduleSlug: PropTypes.string,
};
