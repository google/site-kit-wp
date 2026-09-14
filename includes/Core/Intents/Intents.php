<?php
/**
 * Class Google\Site_Kit\Core\Intents\Intents
 *
 * @package   Google\Site_Kit\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Intents;

/**
 * Class for collecting the intents Site Kit can be asked to handle.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Intents {

	/**
	 * Registered intents keyed by intent ID.
	 *
	 * @since n.e.x.t
	 * @var array<string, Intent>
	 */
	private $intents = array();

	/**
	 * Collects the intents to handle.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		/**
		 * Fires when intents are collected.
		 *
		 * @since n.e.x.t
		 *
		 * @param Intents $intents Intents registry to register intents on.
		 */
		do_action( 'googlesitekit_intents_register', $this );
	}

	/**
	 * Registers an intent.
	 *
	 * The intent registered first for an ID stays; a later one with the same ID is ignored.
	 *
	 * @since n.e.x.t
	 *
	 * @param Intent $intent Intent to register.
	 */
	public function register_intent( Intent $intent ) {
		$id = $intent->get_id();

		if ( isset( $this->intents[ $id ] ) ) {
			return;
		}

		$this->intents[ $id ] = $intent;
	}

	/**
	 * Gets the intent registered for an ID, if it can currently be handled.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $id Intent ID.
	 * @return Intent|null Intent instance, or null if no intent is registered for the ID or the registered one is unavailable.
	 */
	public function get_intent( $id ) {
		if ( ! isset( $this->intents[ $id ] ) ) {
			return null;
		}

		$intent = $this->intents[ $id ];

		return $intent->is_available() ? $intent : null;
	}
}
