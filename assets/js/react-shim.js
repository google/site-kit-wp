/**
 * React shim for ensuring all modules share the same instance of React.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

import React, * as ReactExports from 'react__non-shim';

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

const {
	default: defaultExport,
	Children,
	createRef,
	Component,
	PureComponent,
	createContext,
	forwardRef,
	lazy,
	memo,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useDebugValue,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
	Fragment,
	Profiler,
	StrictMode,
	Suspense,
	createElement,
	cloneElement,
	createFactory,
	isValidElement,
	version,
	__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} = global.googlesitekit._react || { default: React, ...ReactExports };

if ( global.googlesitekit._react === undefined ) {
	global.googlesitekit._react = {
		default: React,
		Children,
		createRef,
		Component,
		PureComponent,
		createContext,
		forwardRef,
		lazy,
		memo,
		useCallback,
		useContext,
		useEffect,
		useImperativeHandle,
		useDebugValue,
		useLayoutEffect,
		useMemo,
		useReducer,
		useRef,
		useState,
		Fragment,
		Profiler,
		StrictMode,
		Suspense,
		createElement,
		cloneElement,
		createFactory,
		isValidElement,
		version,
		__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
	};
}

export default defaultExport;

export {
	Children,
	createRef,
	Component,
	PureComponent,
	createContext,
	forwardRef,
	lazy,
	memo,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useDebugValue,
	useLayoutEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
	Fragment,
	Profiler,
	StrictMode,
	Suspense,
	createElement,
	cloneElement,
	createFactory,
	isValidElement,
	version,
	__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
};
