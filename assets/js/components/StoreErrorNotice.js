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
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { isPermissionScopeError, isInsufficientPermissionsError } from '../util/errors';
import { getInsufficientPermissionsErrorDescription } from '../util/insufficient-permissions-error-description';
import ErrorText from '../components/error-text';
const { useSelect } = Data;

function StoreErrorNotice( { moduleSlug, moduleName, storeName, shouldDisplayError } ) {
	const error = useSelect( ( select ) => select( storeName ).getError() );
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleSlug ) || {} );

	// Do not display if no error, or if the error is for missing scopes.
	if ( ! error || isPermissionScopeError( error ) || ! shouldDisplayError( error ) ) {
		return null;
	}

	let message = error.message;
	if ( isInsufficientPermissionsError( error ) ) {
		message = getInsufficientPermissionsErrorDescription( message, moduleName, module?.owner );
	}

	return <ErrorText message={ message } reconnectURL={ error.data?.reconnectURL } />;
}

StoreErrorNotice.propTypes = {
	module: PropTypes.string.isRequired,
	moduleName: PropTypes.string.isRequired,
	storeName: PropTypes.string.isRequired,
	shouldDisplayError: PropTypes.func,
};

StoreErrorNotice.defaultProps = {
	shouldDisplayError: () => true,
};

export default StoreErrorNotice;
