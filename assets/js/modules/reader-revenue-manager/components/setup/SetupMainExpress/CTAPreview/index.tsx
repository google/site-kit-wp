/**
 * Reader Revenue Manager CTAPreview component.
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
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import InlineEndSVG from '@/svg/graphics/cta-preview-inline-end.svg';
import InlineStartSVG from '@/svg/graphics/cta-preview-inline-start.svg';
import PopupSVG from '@/svg/graphics/cta-preview-popup.svg';

interface Props {
	children?: ReactNode;
	title?: string;
	description?: string;
	footer?: string;
}

export const CTA_PREVIEW_TAB_POPUP = 0;
export const CTA_PREVIEW_TAB_INLINE = 1;
const POPUP_TAB_ID = 'googlesitekit-rrm-cta-preview-tab-popup';
const INLINE_TAB_ID = 'googlesitekit-rrm-cta-preview-tab-inline';

const CTAPreview: FC< Props > = ( {
	children,
	title = __( 'See how it looks', 'google-site-kit' ),
	description = __(
		'The CTA will be implemented automatically as a pop-up. To display it inline, you will need to add a code snippet to the relevant page.',
		'google-site-kit'
	),
	footer = __(
		'Preview intended for visualization purpose only. Verify final appearance on your website.',
		'google-site-kit'
	),
} ) => {
	const [ activeTab, setActiveTab ] = useState< number >(
		CTA_PREVIEW_TAB_POPUP
	);

	function handleTabChange( tabIndex: number ) {
		setActiveTab( tabIndex );
	}

	return (
		<div className="googlesitekit-rrm-cta-preview">
			<div className="googlesitekit-rrm-cta-preview__header">
				<Typography
					as="h3"
					className="googlesitekit-rrm-cta-preview__title"
					type={ TYPE_LABEL }
					size={ SIZE_MEDIUM }
				>
					{ title }
				</Typography>
				<P
					className="googlesitekit-rrm-cta-preview__description"
					size={ SIZE_SMALL }
				>
					{ description }
				</P>
			</div>
			<div className="googlesitekit-rrm-cta-preview__tabs">
				<TabBar
					activeIndex={ activeTab }
					handleActiveIndexUpdate={ handleTabChange }
				>
					<Tab
						id={ POPUP_TAB_ID }
						focusOnActivate={ false }
						type="button"
					>
						<span className="mdc-tab__text-label">
							{ __( 'Pop-up', 'google-site-kit' ) }
						</span>
					</Tab>
					<Tab
						id={ INLINE_TAB_ID }
						focusOnActivate={ false }
						type="button"
					>
						<span className="mdc-tab__text-label">
							{ __( 'Inline', 'google-site-kit' ) }
						</span>
					</Tab>
				</TabBar>
			</div>
			{ activeTab === CTA_PREVIEW_TAB_POPUP && (
				<div
					aria-labelledby={ POPUP_TAB_ID }
					className="googlesitekit-rrm-cta-preview__panel googlesitekit-rrm-cta-preview__panel--popup"
					role="tabpanel"
				>
					<div className="googlesitekit-rrm-cta-preview__panel-content">
						<PopupSVG aria-hidden="true" />
						{ children && (
							<div className="googlesitekit-rrm-cta-preview__panel-card">
								{ children }
							</div>
						) }
					</div>
				</div>
			) }
			{ activeTab === CTA_PREVIEW_TAB_INLINE && (
				<div
					aria-labelledby={ INLINE_TAB_ID }
					className="googlesitekit-rrm-cta-preview__panel googlesitekit-rrm-cta-preview__panel--inline"
					role="tabpanel"
				>
					<div className="googlesitekit-rrm-cta-preview__panel-content">
						<InlineStartSVG aria-hidden="true" />
						{ children && (
							<div className="googlesitekit-rrm-cta-preview__panel-card">
								{ children }
							</div>
						) }
						<InlineEndSVG aria-hidden="true" />
					</div>
				</div>
			) }
			{ footer && (
				<P
					className="googlesitekit-rrm-cta-preview__footer"
					size={ SIZE_SMALL }
				>
					{ footer }
				</P>
			) }
		</div>
	);
};

export default CTAPreview;
