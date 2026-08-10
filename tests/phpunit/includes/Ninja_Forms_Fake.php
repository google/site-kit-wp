<?php
/**
 * Ninja_Forms_Fake
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests;

/**
 * Fakes the Ninja Forms plugin's `Ninja_Forms` class, holding its forms in memory
 * rather than in the plugin's tables.
 *
 * A test adds the forms it needs through `add_form()`, and `form()` then returns
 * a factory for every ID. An ID no test added gives a form with no title, and the
 * real plugin gives a form with no title for a deleted form too. The test
 * environment installs no Ninja Forms, and `ninja-forms-fake-functions.php`
 * returns this instance from the global `Ninja_Forms()` function.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Ninja_Forms_Fake {

	/**
	 * The single instance the global `Ninja_Forms()` function returns.
	 *
	 * @since n.e.x.t
	 * @var Ninja_Forms_Fake
	 */
	private static $instance;

	/**
	 * Each form title a test added, with the form ID as the key.
	 *
	 * @since n.e.x.t
	 * @var array
	 */
	private $form_titles = array();

	/**
	 * Gets the single instance, matching the plugin's own `Ninja_Forms::instance()`.
	 *
	 * A test adds a form through one call and the code under test reads it through
	 * another, because `Ninja_Forms_Fake` keeps one instance for the whole process.
	 *
	 * @since n.e.x.t
	 *
	 * @return Ninja_Forms_Fake The single instance.
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Adds a form title for the given ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int    $form_id The form ID.
	 * @param string $title   The title the form stores.
	 */
	public function add_form( $form_id, $title ) {
		$this->form_titles[ $form_id ] = $title;
	}

	/**
	 * Gets a `Ninja_Forms_Model_Factory_Fake` for a form ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param int $form_id The form ID.
	 * @return Ninja_Forms_Model_Factory_Fake The factory holding the form.
	 */
	public function form( $form_id ) {
		$form = new Ninja_Forms_Form_Model_Fake( $this->form_titles[ $form_id ] ?? '' );

		return new Ninja_Forms_Model_Factory_Fake( $form );
	}
}
