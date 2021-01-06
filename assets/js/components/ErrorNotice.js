/**
 * ErrorNotice component.
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
import { Cell, Row } from '../material-components';

/**
 * Internal dependencies
 */
import { isPermissionScopeError } from '../util/errors';
import ErrorText from './ErrorText';

export default function ErrorNotice( { error, shouldDisplayError = () => true } ) {
	// Do not display if no error, or if the error is for missing scopes.
	if ( ! error || isPermissionScopeError( error ) || ! shouldDisplayError( error ) ) {
		return null;
	}

	return (
		<div className={ 'googlesitekit-user-input__error' }>
			<Row>
				<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
					<ErrorText
						message={ error.message }
						reconnectURL={ error.data?.reconnectURL }
					/>
				</Cell>
			</Row>
		</div>
	);
}

ErrorNotice.propTypes = {
	error: PropTypes.shape( {
		message: PropTypes.string,
	} ),
	shouldDisplayError: PropTypes.func,
};
