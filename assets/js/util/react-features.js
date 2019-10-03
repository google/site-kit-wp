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

export const Suspense = wpSuspense || ReactSuspense;
export const lazy = wpLazy || ReactLazy;
export const useEffect = wpUseEffect || ReactUseEffect;
export const useState = wpUseState || ReactUseState;
