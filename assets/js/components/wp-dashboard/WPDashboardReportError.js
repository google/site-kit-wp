/**
 * WPDashboardReportError component.
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
import { useLifecycles } from 'react-use';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import ReportError from '../ReportError';

const { useSelect, useDispatch } = Data;

export default function WPDashboardReportError( { moduleSlug, error } ) {
	const errorInstanceID = useInstanceId(
		WPDashboardReportError,
		'WPDashboardReportError'
	);

	const { setValue } = useDispatch( CORE_UI );

	const errorMessage = Array.isArray( error )
		? error[ 0 ].message
		: error.message;

	const selectInstanceID = useSelect( ( select ) =>
		select( CORE_UI ).getValue(
			`WPDashboardReportError-${ moduleSlug }-${ errorMessage }`
		)
	);

	useLifecycles(
		() => {
			setValue(
				`WPDashboardReportError-${ moduleSlug }-${ errorMessage }`,
				errorInstanceID
			);
		},
		() => {
			setValue(
				`WPDashboardReportError-${ moduleSlug }-${ errorMessage }`,
				undefined
			);
		}
	);

	if ( selectInstanceID !== errorInstanceID ) {
		return null;
	}

	return <ReportError moduleSlug={ moduleSlug } error={ error } />;
}

WPDashboardReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
};
