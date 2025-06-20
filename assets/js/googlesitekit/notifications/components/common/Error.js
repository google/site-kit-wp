/**
 * Site Kit by Google, Copyright 2025 Google LLC
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

/*
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../datastore/site/constants';
import ErrorNotice from '../../../../components/ErrorNotice';

export default function Error( { id } ) {
	const ctaError = useSelect( ( select ) => {
		return select( CORE_SITE ).getError( 'notificationAction', [ id ] );
	} );

	const { clearError } = useDispatch( CORE_SITE );

	useEffect( () => {
		return () => {
			clearError( 'notificationAction', [ id ] );
		};
	}, [ clearError, id ] );

	return ctaError ? <ErrorNotice message={ ctaError.message } /> : null;
}

// eslint-disable-next-line sitekit/acronym-case
Error.propTypes = {
	id: PropTypes.string,
};
