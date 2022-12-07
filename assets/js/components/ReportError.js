/**
 * ReportError component.
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
 * Internal dependencies
 */
import CTA from './notifications/CTA';
import { useErrors } from '../hooks/useErrors';

export default function ReportError( { moduleSlug, error } ) {
	const { title, description, retryElement, requestAccesElement } = useErrors(
		moduleSlug,
		error
	);

	return (
		<CTA title={ title } description={ description } error>
			<div className="googlesitekit-error-cta-wrapper">
				{ requestAccesElement }
				{ retryElement }
			</div>
		</CTA>
	);
}

ReportError.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	error: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.object ),
		PropTypes.object,
	] ).isRequired,
};
