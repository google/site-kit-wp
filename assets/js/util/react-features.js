/**
 * External dependencies
 */
import {
	Suspense as ReactSuspense,
	lazy as ReactLazy,
} from 'react';

const {
	Suspense: wpSuspense,
	lazy: wpLazy,
} = wp.element;

export const Suspense = !! wpSuspense ? wpSuspense : ReactSuspense;
export const lazy = !! wpLazy ? wpLazy : ReactLazy;
