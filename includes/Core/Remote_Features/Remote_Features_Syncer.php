<?php
/**
 * Class Google\Site_Kit\Core\Remote_Features\Remote_Features_Syncer
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Remote_Features;

use Closure;
use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Class handling the synchronization of remote features with local storage.
 *
 * @since 1.133.0
 * @access private
 * @ignore
 */
class Remote_Features_Syncer {

	/**
	 * Remote_Features instance.
	 *
	 * @var Remote_Features
	 */
	private $remote_features;

	/**
	 * Function which fetches features.
	 *
	 * @var Closure
	 */
	private $fetch_features;

	/**
	 * Guard instances.
	 *
	 * @var Guard_Interface[]
	 */
	private array $guards;

	/**
	 * Constructor.
	 *
	 * @since 1.133.0
	 *
	 * @param Remote_Features $remote_features Remote_Features instance.
	 * @param Closure         $fetch_features  Function which fetches features.
	 * @param Guard_Interface ...$guards       Guard instances.
	 */
	public function __construct(
		Remote_Features $remote_features,
		Closure $fetch_features,
		Guard_Interface ...$guards
	) {
		$this->remote_features = $remote_features;
		$this->fetch_features  = $fetch_features;
		$this->guards          = $guards;
	}

	/**
	 * Fetches the latest remote features and sets them in storage.
	 *
	 * @since 1.133.0
	 */
	public function pull_remote_features() {
		foreach ( $this->guards as $guard ) {
			if ( ! $guard->can_activate() ) {
				return;
			}
		}

		$features = ( $this->fetch_features )();

		if ( ! is_wp_error( $features ) && is_array( $features ) ) {
			$this->remote_features->set( $features );
		}
	}
}
