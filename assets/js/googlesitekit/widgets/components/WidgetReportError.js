/**
 * WidgetReportError component.
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
import ReportError from '../../../components/ReportError';
import { CORE_UI } from '../../datastore/ui/constants';

const { useSelect, useDispatch } = Data;

export default function WidgetReportError( { moduleSlug, error } ) {
	const errorInstanceID = useInstanceId(
		WidgetReportError,
		'WidgetReportError'
	);

	const { setValue } = useDispatch( CORE_UI );

	const selectInstanceID = useSelect( ( select ) =>
		select( CORE_UI ).getValue(
			`WidgetReportError-${ moduleSlug }-${ error.message }`
		)
	);

	useLifecycles(
		() => {
			setValue(
				`WidgetReportError-${ moduleSlug }-${ error.message }`,
				errorInstanceID
			);
		},
		() => {
			setValue(
				`WidgetReportError-${ moduleSlug }-${ error.message }`,
				undefined
			);
		}
	);

	if ( selectInstanceID !== errorInstanceID ) {
		return null;
	}

	return <ReportError moduleSlug={ moduleSlug } error={ error } />;
}

WidgetReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
};
