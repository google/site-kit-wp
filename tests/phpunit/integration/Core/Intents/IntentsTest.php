<?php
/**
 * Class Google\Site_Kit\Tests\Core\Intents\IntentsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Intents
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Intents;

use Google\Site_Kit\Core\Intents\Intents;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Intents
 */
class IntentsTest extends TestCase {

	/**
	 * Intents instance.
	 *
	 * @var Intents
	 */
	private $intents;

	public function set_up() {
		parent::set_up();

		// The Ads module adds a listener when the plugin loads, which would otherwise register the real Ads intent into the instance below.
		remove_all_actions( 'googlesitekit_intents_register' );

		$this->intents = new Intents();
	}

	public function test_get_intent__returns_a_registered_intent_that_is_available() {
		$intent = new FakeIntent( 'test-intent' );

		$this->intents->register_intent( $intent );

		$this->assertSame( $intent, $this->intents->get_intent( 'test-intent' ), 'An available intent should be returned for the ID it was registered under.' );
	}

	public function test_get_intent__returns_null_for_an_ID_that_was_never_registered() {
		$this->intents->register_intent( new FakeIntent( 'test-intent' ) );

		$this->assertNull( $this->intents->get_intent( 'another-intent' ), 'An ID nothing was registered under should have no intent.' );
	}

	public function test_get_intent__returns_null_for_a_registered_intent_that_is_not_available() {
		$this->intents->register_intent( new FakeIntent( 'test-intent', false ) );

		$this->assertNull( $this->intents->get_intent( 'test-intent' ), 'An intent that reports itself unavailable should not be returned.' );
	}

	public function test_register__passes_the_Intents_instance() {
		$invocations = array();
		$callback    = function () use ( &$invocations ) {
			$invocations[] = func_get_args();
		};

		add_action( 'googlesitekit_intents_register', $callback );

		$this->intents->register();

		$this->assertCount( 1, $invocations, 'The action should fire once.' );
		$this->assertEquals( array( $this->intents ), $invocations[0], 'The action should pass the Intents instance.' );
	}

	public function test_register_intent__keeps_the_intent_that_was_registered_first_for_an_ID() {
		$first  = new FakeIntent( 'test-intent' );
		$second = new FakeIntent( 'test-intent' );

		$this->intents->register_intent( $first );
		$this->intents->register_intent( $second );

		$this->assertSame( $first, $this->intents->get_intent( 'test-intent' ), 'The intent registered first should stay.' );
	}

	public function test_get_query_args__returns_both_arguments_encoded() {
		$this->assertSame(
			array(
				'intent'      => 'ads-conversion-tracking',
				'intent_code' => 'ab%2Bc%2Fd%3D',
			),
			Intents::get_query_args( 'ads-conversion-tracking', 'ab+c/d=' ),
			'Both intent arguments should be returned, encoded for `add_query_arg()`.'
		);
	}

	public function data_incomplete_intent_query_args() {
		return array(
			'no intent'           => array( null, 'abc123' ),
			'no intent code'      => array( 'ads-conversion-tracking', null ),
			'empty intent'        => array( '', 'abc123' ),
			'empty intent code'   => array( 'ads-conversion-tracking', '' ),
			'array intent'        => array( array( 'ads-conversion-tracking' ), 'abc123' ),
			'false from `filter`' => array( false, false ),
		);
	}

	/**
	 * @dataProvider data_incomplete_intent_query_args
	 *
	 * @param mixed $intent      Intent ID.
	 * @param mixed $intent_code One-time code for the intent.
	 */
	public function test_get_query_args__returns_empty_array_without_both_arguments( $intent, $intent_code ) {
		$this->assertSame(
			array(),
			Intents::get_query_args( $intent, $intent_code ),
			'An empty array should be returned unless both intent arguments are non-empty strings.'
		);
	}
}
