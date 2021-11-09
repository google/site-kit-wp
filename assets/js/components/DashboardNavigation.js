/**
 * DashboardNavigation component.
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
import { ChipSet, Chip } from '@material/react-chips';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_MONETIZATION,
	ANCHOR_ID_SPEED,
	ANCHOR_ID_TRAFFIC,
} from '../googlesitekit/constants';

export default function DashboardNavigation() {
	const [ selectedIds, setSelectedIds ] = useState( [] );
	return (
		<ChipSet
			choice
			selectedChipIds={ selectedIds }
			handleSelect={ setSelectedIds }
		>
			<Chip
				id={ ANCHOR_ID_TRAFFIC }
				label={ __( 'Traffic', 'google-site-kit' ) }
			/>
			<Chip
				id={ ANCHOR_ID_CONTENT }
				label={ __( 'Content', 'google-site-kit' ) }
			/>
			<Chip
				id={ ANCHOR_ID_SPEED }
				label={ __( 'Speed', 'google-site-kit' ) }
			/>
			<Chip
				id={ ANCHOR_ID_MONETIZATION }
				label={ __( 'Monetization', 'google-site-kit' ) }
			/>
		</ChipSet>
	);
}
