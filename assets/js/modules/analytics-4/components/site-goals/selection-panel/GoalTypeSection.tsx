/**
 * Site Goals Selection Panel Goal Type Section component.
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
import classnames from 'classnames';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import ChevronDownIcon from '@/svg/icons/chevron-down.svg';

interface GoalTypeSectionProps {
	listID: string;
	title: string;
	isExpanded: boolean;
	onToggleExpand: () => void;
}

const GoalTypeSection: FC< GoalTypeSectionProps > = ( {
	listID,
	title,
	isExpanded,
	onToggleExpand,
	children,
} ) => {
	return (
		<section className="googlesitekit-site-goals-selection-panel__section">
			<button
				type="button"
				className="googlesitekit-site-goals-selection-panel__section-toggle"
				onClick={ onToggleExpand }
				aria-expanded={ isExpanded }
				aria-controls={ `site-goals-selection-section-${ listID }` }
			>
				<span className="googlesitekit-site-goals-selection-panel__section-toggle-content">
					<ChevronDownIcon
						width={ 20 }
						height={ 20 }
						className={ classnames(
							'googlesitekit-site-goals-selection-panel__section-toggle-icon',
							{
								'googlesitekit-site-goals-selection-panel__section-toggle-icon--expanded':
									isExpanded,
							}
						) }
					/>
					<Typography
						as="span"
						type="title"
						size="large"
						className="googlesitekit-site-goals-selection-panel__section-title"
					>
						{ title }
					</Typography>
				</span>
			</button>

			{ isExpanded && (
				<div
					id={ `site-goals-selection-section-${ listID }` }
					className="googlesitekit-site-goals-selection-panel__items"
				>
					{ children }
				</div>
			) }
		</section>
	);
};

export default GoalTypeSection;
