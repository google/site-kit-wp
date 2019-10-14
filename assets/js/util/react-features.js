/**
 * External dependencies
 */
import {
	Suspense as ReactSuspense,
	lazy as ReactLazy,
	useEffect as ReactUseEffect,
	useState as ReactUseState,
} from 'react';

const {
	Suspense: wpSuspense,
	lazy: wpLazy,
	useEffect: wpUseEffect,
	useState: wpUseState,
} = wp.element;

export const Suspense = !! wpSuspense ? wpSuspense : ReactSuspense;
export const lazy = !! wpLazy ? wpLazy : ReactLazy;
export const useEffect = !! wpUseEffect ? wpUseEffect : ReactUseEffect;
export const useState = !! wpUseState ? wpUseState : ReactUseState;
