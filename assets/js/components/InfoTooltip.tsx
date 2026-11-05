/**
 * InfoTooltip component.
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
import classnames from 'classnames';
import { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Tooltip } from 'googlesitekit-components';
import InfoIcon from '@/svg/icons/info-green.svg';

interface InfoTooltipProps {
	onOpen?: () => void;
	title?: ReactNode;
	tooltipClassName?: string;
}

const InfoTooltip: FC< InfoTooltipProps > = ( {
	onOpen,
	title,
	tooltipClassName,
} ) => {
	const labelID = useInstanceId(
		InfoTooltip,
		'googlesitekit-info-tooltip-label'
	) as string;

	if ( ! title ) {
		return null;
	}

	return (
		// @ts-expect-error `Tooltip` is not typed.
		<Tooltip
			className="googlesitekit-info-tooltip"
			tooltipClassName={ classnames(
				'googlesitekit-info-tooltip__content',
				tooltipClassName
			) }
			title={ title }
			placement="top"
			enterTouchDelay={ 0 }
			leaveTouchDelay={ 5000 }
			onOpen={ onOpen }
			interactive
		>
			<span
				tabIndex={ 0 }
				role="button"
				aria-labelledby={ labelID }
				// Stops `Tooltip` from also using the text as a description, as a
				// native `title` while closed and as an `aria-describedby` reference
				// once open, so a screen reader reads it only once.
				title={ undefined }
				aria-describedby={ undefined }
			>
				<InfoIcon width="16" height="16" />
				<span
					id={ labelID }
					// The tooltip content exists only while the tooltip is open,
					// so this hidden copy of the text names the icon at all times.
					hidden
				>
					{ title }
				</span>
			</span>
		</Tooltip>
	);
};

export default InfoTooltip;
