<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Fallback
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

/**
 * Class providing the integration of remote features.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Remote_Features_Fallback {

	/**
	 * Remote_Features_Syncer instance.
	 *
	 * @var Remote_Features_Syncer
	 */
	private Remote_Features_Syncer $syncer;

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private Remote_Features $setting;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Remote_Features_Syncer $syncer  Remote_Features_Syncer instance.
	 * @param Remote_Features        $setting Remote_Features instance.
	 */
	public function __construct(
		Remote_Features_Syncer $syncer,
		Remote_Features $setting
	) {
		$this->syncer  = $syncer;
		$this->setting = $setting;
	}

	/**
	 * Fallback for syncing the remote features.
	 *
	 * @since n.e.x.t
	 */
	public function remote_features_sync_fallback() {
		$remote_features = $this->setting->get();
		$last_sync_at    = $remote_features['last_updated_at'] ?? 0;
		$is_sync_overdue = ( time() - $last_sync_at ) > DAY_IN_SECONDS;

		if ( $is_sync_overdue || ! $last_sync_at ) {
			$this->syncer->pull_remote_features();
		}
	}
}
