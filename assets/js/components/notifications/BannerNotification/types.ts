/**
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

export type LEARN_MORE_TARGET = 'external' | 'internal';

export type BannerNotificationProps = {
	id: string;
	className?: string;
	children?: React.ReactNode;
	title: string;
	description?: React.ReactNode;
	learnMoreURL?: string;
	learnMoreDescription?: string;
	learnMoreLabel?: string;
	learnMoreTarget?: LEARN_MORE_TARGET;
	WinImageSVG?: React.ElementType;
	SmallImageSVG?: React.ElementType;
	format?: string;
	ctaLink?: string;
	ctaLabel?: string;
	ctaTarget?: string;
	type?: string;
	dismiss?: string;
	isDismissible?: boolean;
	logo?: boolean;
	module?: string;
	moduleName?: string;
	dismissExpires?: number;
	showOnce?: boolean;
	onCTAClick?: ( event: React.MouseEvent ) => void | Promise< any >;
	onView?: () => void;
	onDismiss?: ( event: React.MouseEvent ) => void | Promise< any >;
	onLearnMoreClick?: ( event: React.MouseEvent ) => void | Promise< any >;
	badgeLabel?: string;
	rounded?: boolean;
	footer?: React.ReactNode;
	secondaryPane?: React.ReactNode;
	showSmallWinImage?: boolean;
	smallWinImageSVGWidth?: number;
	smallWinImageSVGHeight?: number;
	mediumWinImageSVGWidth?: number;
	mediumWinImageSVGHeight?: number;
	ctaComponent?: React.ReactNode;
};

// eslint-disable-next-line sitekit/acronym-case
export type BannerProps = React.HTMLProps< HTMLElement > & {
	id?: string;
	secondaryPane?: React.ReactNode;
};

export type BannerActionsProps = {
	ctaLink?: string;
	ctaLabel?: string;
	ctaComponent?: React.ReactElement;
	ctaTarget?: string;
	ctaCallback?: ( ...args: any[] ) => Promise< any > | void;
	dismissLabel?: string;
	dismissCallback?: ( ...args: any[] ) => Promise< any > | void;
};

export type BannerDescriptionProps = {
	description: React.ReactNode;
	learnMoreLabel?: string;
	learnMoreURL?: string;
	learnMoreDescription?: string;
	learnMoreTarget?: LEARN_MORE_TARGET;
	onLearnMoreClick?: () => void;
};

export type BannerIconProps = {
	type?: string;
};
