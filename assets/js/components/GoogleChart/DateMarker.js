/**
 * GoogleChart DateMarker component.
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
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect } from '@wordpress/element';
import { Icon, info } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Tooltip } from 'googlesitekit-components';
import useViewContext from '../../hooks/useViewContext';
import { useDebounce } from '../../hooks/useDebounce';
import { trackEvent } from '../../util';

export default function DateMarker( { id, text } ) {
	const viewContext = useViewContext();

	const eventCategory = `${ viewContext }_ga4-data-collection-line`;

	useEffect( () => {
		trackEvent( eventCategory, 'chart_line_view' );
	}, [ eventCategory ] );

	const trackTooltipOpen = useCallback( () => {
		trackEvent( eventCategory, 'chart_tooltip_view' );
	}, [ eventCategory ] );

	const handleTooltipOpen = useDebounce( trackTooltipOpen, 5000, {
		leading: true,
		trailing: false,
	} );

	return (
		<Fragment>
			<div
				id={ `googlesitekit-chart__date-marker-line--${ id }` }
				className="googlesitekit-chart__date-marker-line"
			/>
			{ text && (
				<div
					id={ `googlesitekit-chart__date-marker-tooltip--${ id }` }
					className="googlesitekit-chart__date-marker-tooltip"
				>
					<Tooltip title={ text } onOpen={ handleTooltipOpen }>
						<span>
							<Icon
								fill="currentColor"
								icon={ info }
								size={ 18 }
							/>
						</span>
					</Tooltip>
				</div>
			) }
		</Fragment>
	);
}
