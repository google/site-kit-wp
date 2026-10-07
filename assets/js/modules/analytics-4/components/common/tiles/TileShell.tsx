/**
 * TileShell component.
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
import type { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import InfoTooltip from '@/js/components/InfoTooltip';
import Typography from '@/js/components/Typography';

export interface TileShellProps {
	/** Block class; the `__inner`, `__header`, `__title` and `__body` classes are built from it. */
	baseClassName: string;
	/** Extra class for the outer element. */
	className?: string;
	/** Tile title, shown as an `h3`. */
	title: ReactNode;
	/** Label at the end of the header, such as a column name. */
	headerLabel?: string;
	/** Tooltip content shown next to the title. */
	infoTooltip?: ReactNode;
	/** Extra class for the body element. */
	bodyClassName?: string;
}

const TileShell: FC< TileShellProps > = ( {
	baseClassName,
	className,
	title,
	headerLabel,
	infoTooltip,
	bodyClassName,
	children,
} ) => {
	return (
		<div className={ classnames( baseClassName, className ) }>
			<div className={ `${ baseClassName }__inner` }>
				<div className={ `${ baseClassName }__header` }>
					<Typography
						as="h3"
						type="title"
						size="small"
						className={ `${ baseClassName }__title` }
					>
						{ title }
					</Typography>

					{ !! infoTooltip && <InfoTooltip title={ infoTooltip } /> }

					{ !! headerLabel && (
						<Typography
							as="span"
							type="body"
							size="medium"
							className={ `${ baseClassName }__header-label` }
						>
							{ headerLabel }
						</Typography>
					) }
				</div>

				<div
					className={ classnames(
						`${ baseClassName }__body`,
						bodyClassName
					) }
				>
					{ children }
				</div>
			</div>
		</div>
	);
};

export default TileShell;
