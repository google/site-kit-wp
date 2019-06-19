/**
 * This file is intended to detect active ad blocker.
 *
 * Ad blockers block URLs containing the word "ads" including this file.
 * If the file does load, `googlesitekit.canAdsRun` is set to true.
 */

window.googlesitekit = window.googlesitekit || {};
googlesitekit.canAdsRun = true;
