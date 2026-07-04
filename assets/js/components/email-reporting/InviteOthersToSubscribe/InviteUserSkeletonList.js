/**
 * InviteUserSkeletonList component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import PreviewBlock from '@/js/components/PreviewBlock';

export default function InviteUserSkeletonList( { visibleItems = 3 } ) {
	return (
		<div className="googlesitekit-invite-user-list">
			{ Array.from( { length: visibleItems } ).map( ( _, index ) => (
				<div
					key={ index }
					className="googlesitekit-invite-user-row googlesitekit-invite-user-row--loading"
				>
					<div className="googlesitekit-invite-user-row__info">
						<PreviewBlock width="120px" height="16px" />
						<PreviewBlock width="180px" height="12px" />
					</div>
					<div className="googlesitekit-invite-user-row__action">
						<PreviewBlock
							width="90px"
							height="32px"
							shape="square"
						/>
					</div>
				</div>
			) ) }
		</div>
	);
}

InviteUserSkeletonList.propTypes = {
	visibleItems: PropTypes.number,
};
