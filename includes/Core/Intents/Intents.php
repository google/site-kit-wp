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
 * @since 1.188.0
 * @access private
 * @ignore
 */
class Intents {

	/**
	 * Registered intents keyed by intent ID.
	 *
	 * @since 1.188.0
	 * @var array<string, Intent>
	 */
	private $intents = array();

	/**
	 * Collects the intents to handle.
	 *
	 * @since 1.188.0
	 */
	public function register() {
		/**
		 * Fires when intents are collected.
		 *
		 * @since 1.188.0
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
	 * @since 1.188.0
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
	 * @since 1.188.0
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

	/**
	 * Gets the query arguments that pass an intent on to the next screen of a flow.
	 *
	 * An intent is only handled with both its ID and its code, so nothing is returned unless both are non-empty strings.
	 *
	 * @since n.e.x.t
	 *
	 * @param mixed $intent      Intent ID.
	 * @param mixed $intent_code One-time code for the intent.
	 * @return array<string, string> Encoded `intent` and `intent_code` query arguments for `add_query_arg()`, or an empty array.
	 */
	public static function get_query_args( $intent, $intent_code ) {
		if ( ! is_string( $intent ) || ! is_string( $intent_code ) || '' === $intent || '' === $intent_code ) {
			return array();
		}

		// `add_query_arg()` expects new values to be encoded already.
		return array(
			'intent'      => rawurlencode( $intent ),
			'intent_code' => rawurlencode( $intent_code ),
		);
	}
}
