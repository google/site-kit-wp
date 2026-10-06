/**
 * MetricTileTablePlainText component.
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
 * Internal dependencies
 */
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

export default function MetricTileTablePlainText( { content } ) {
	return (
		<P
			className="googlesitekit-km-widget-tile__table-plain-text"
			size={ SIZE_SMALL }
			type={ TYPE_BODY }
		>
			{ content }
		</P>
	);
}

MetricTileTablePlainText.propTypes = {
	content: PropTypes.string.isRequired,
};
