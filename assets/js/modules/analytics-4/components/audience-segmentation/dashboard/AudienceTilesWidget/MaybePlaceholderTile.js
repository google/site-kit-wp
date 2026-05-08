/**
 * MaybePlaceholderTile component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import AudienceTileLoading from './AudienceTile/AudienceTileLoading';
import PlaceholderTile from './PlaceholderTile';

export default function MaybePlaceholderTile( {
	Widget,
	loading,
	allTilesError,
	visibleAudienceCount,
} ) {
	if (
		( allTilesError === false || loading ) &&
		visibleAudienceCount === 1
	) {
		if ( loading ) {
			return (
				<Widget noPadding>
					<AudienceTileLoading />
				</Widget>
			);
		}

		return <PlaceholderTile Widget={ Widget } />;
	}

	return null;
}

MaybePlaceholderTile.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	loading: PropTypes.bool.isRequired,
	allTilesError: PropTypes.bool,
	visibleAudienceCount: PropTypes.number.isRequired,
};
