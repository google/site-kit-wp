/**
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
import { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { SIZE_MEDIUM, TYPE_TITLE } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';

export interface TilesGroupProps {
	title: string;
	className?: string;
	headerCTA?: ReactNode;
	badge?: ReactNode;
}

export const TilesGroup: FC< TilesGroupProps > = ( {
	title,
	className,
	headerCTA,
	badge,
	children,
} ) => {
	const breakpoint = useBreakpoint();
	const isMobileBreakpoint = breakpoint === BREAKPOINT_SMALL;

	return (
		<div
			className={ classnames(
				'googlesitekit-site-goals-tiles-group',
				className
			) }
		>
			<div className="googlesitekit-site-goals-tiles-group__header">
				<P
					className="googlesitekit-site-goals-tiles-group__title"
					size={ SIZE_MEDIUM }
					type={ TYPE_TITLE }
				>
					{ title }
				</P>
				{ ! isMobileBreakpoint && headerCTA && (
					<div className="googlesitekit-site-goals-tiles-group__cta">
						{ headerCTA }
					</div>
				) }
			</div>
			{ badge && (
				<div className="googlesitekit-site-goals-tiles-group__badge">
					{ badge }
				</div>
			) }
			<div className="googlesitekit-site-goals-tiles-group__tiles">
				{ children }
			</div>
			{ isMobileBreakpoint && headerCTA && (
				<div className="googlesitekit-site-goals-tiles-group__footer-cta">
					{ headerCTA }
				</div>
			) }
		</div>
	);
};
