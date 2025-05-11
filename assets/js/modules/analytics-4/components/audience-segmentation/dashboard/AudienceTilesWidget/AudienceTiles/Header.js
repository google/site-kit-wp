/**
 * AudienceTilesWidget Header component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import { useInViewSelect } from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../../../../datastore/constants';
import { trackEvent } from '../../../../../../../util';
import useViewContext from '../../../../../../../hooks/useViewContext';
import AudienceTooltipMessage from '../AudienceTooltipMessage';
import InfoTooltip from '../../../../../../../components/InfoTooltip';

export default function Header( {
	activeTileIndex,
	setActiveTile,
	visibleAudiences,
} ) {
	const viewContext = useViewContext();

	const audiences = useInViewSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences();
	}, [] );

	return (
		<TabBar
			// Force re-render when the number of audiences change, this is a workaround for a bug in TabBar which maintains an internal list of tabs but doesn't update it when the number of tabs is reduced.
			key={ visibleAudiences.length }
			className="googlesitekit-widget-audience-tiles__tabs googlesitekit-tab-bar--start-aligned-high-contrast"
			activeIndex={ activeTileIndex }
			handleActiveIndexUpdate={ ( index ) =>
				setActiveTile( visibleAudiences[ index ] )
			}
		>
			{ visibleAudiences.map( ( audienceResourceName, index ) => {
				const audienceName =
					audiences?.filter(
						( { name } ) => name === audienceResourceName
					)?.[ 0 ]?.displayName || '';

				const audienceSlug =
					audiences?.filter(
						( { name } ) => name === audienceResourceName
					)?.[ 0 ]?.audienceSlug || '';

				const tooltipMessage = (
					<AudienceTooltipMessage
						audienceName={ audienceName }
						audienceSlug={ audienceSlug }
					/>
				);

				return (
					<Tab
						// It's a bit counterintuitive, but we need to use `index` as the key here due to how the internal implementation of TabBar works.
						// Specifically, how it maintains an internal list of tabs and pushes new tabs onto the end of the list when it sees a new child. See the use of pushToTabList in renderTab:
						// https://github.com/material-components/material-components-web-react/blob/04ecb80383e49ff0dea765d5fc0d14a442a73c92/packages/tab-bar/index.tsx#L202-L212
						// If we use `audienceResourceName` as the key, and the list of audiences changes, the TabBar's internal list of tabs may go out of sync with the rendered list
						// and the wrong tab will be selected when switching between audiences.
						key={ index }
						aria-label={ audienceName }
					>
						{ audienceName }
						<InfoTooltip
							title={ tooltipMessage }
							tooltipClassName="googlesitekit-info-tooltip__content--audience"
							onOpen={ () => {
								trackEvent(
									`${ viewContext }_audiences-tile`,
									'view_tile_tooltip',
									audienceSlug
								);
							} }
						/>
					</Tab>
				);
			} ) }
		</TabBar>
	);
}
