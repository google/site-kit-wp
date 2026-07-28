<?php
/**
 * Dismissed_PromptsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Prompts
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\Prompts;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Prompts\Dismissed_Prompts;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\TestCase;

class Dismissed_PromptsTest extends TestCase {

	/**
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * @var Dismissed_Prompts
	 */
	private $dismissed_prompts;

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create();
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

		$this->user_options      = new User_Options( $context, $user_id );
		$this->dismissed_prompts = new Dismissed_Prompts( $this->user_options );
		$this->dismissed_prompts->register();
	}

	public function test_add() {
		$this->assertEmpty(
			$this->user_options->get( Dismissed_Prompts::OPTION ),
			'Dismissed prompts should initially be empty.'
		);

		$this->dismissed_prompts->add( 'foo' );
		$this->assertEquals(
			array(
				'foo' => array(
					'expires' => 0,
					'count'   => 1,
				),
			),
			$this->user_options->get( Dismissed_Prompts::OPTION ),
			'Prompt without an expiration should be stored with one dismissal and no expiry.'
		);

		$this->dismissed_prompts->add( 'bar', 100 );

		$prompt_response = $this->user_options->get( Dismissed_Prompts::OPTION );
		// The asserts are split to use assertEqualsWithDelta for the time based assertion.
		$this->assertArrayHasKey( 'foo', $prompt_response, 'Previously dismissed prompt should remain stored.' );
		$this->assertArrayHasKey( 'bar', $prompt_response, 'Newly dismissed prompt should be stored.' );
		$this->assertEquals( 0, $prompt_response['foo']['expires'], 'Prompt dismissed without expiration should not expire.' );
		$this->assertEquals( 1, $prompt_response['foo']['count'], 'First prompt dismissal should have a count of one.' );
		$this->assertEqualsWithDelta( time() + 100, $prompt_response['bar']['expires'], 2, 'Prompt expiration should be based on the requested duration.' );
		$this->assertEquals( 1, $prompt_response['bar']['count'], 'New prompt dismissal should have a count of one.' );
	}

	public function test_remove() {
		$this->user_options->set(
			Dismissed_Prompts::OPTION,
			array(
				'foo' => array(
					'expires' => 0,
					'count'   => 1,
				),
				'bar' => array(
					'expires' => time() + 100,
					'count'   => 1,
				),
			)
		);

		$prompt_response = $this->user_options->get( Dismissed_Prompts::OPTION );
		// The asserts are split to use assertEqualsWithDelta for the time based assertion.
		$this->assertArrayHasKey( 'foo', $prompt_response, 'Permanent prompt dismissal should exist before removal.' );
		$this->assertArrayHasKey( 'bar', $prompt_response, 'Expiring prompt dismissal should exist before removal.' );
		$this->assertEquals( 0, $prompt_response['foo']['expires'], 'Permanent prompt dismissal should have no expiry.' );
		$this->assertEquals( 1, $prompt_response['foo']['count'], 'Permanent prompt should have been dismissed once.' );
		$this->assertEqualsWithDelta( time() + 100, $prompt_response['bar']['expires'], 2, 'Expiring prompt should retain its expiration timestamp.' );
		$this->assertEquals( 1, $prompt_response['bar']['count'], 'Expiring prompt should have been dismissed once.' );

		$this->dismissed_prompts->remove( 'bar' );

		$this->assertEquals(
			array(
				'foo' => array(
					'expires' => 0,
					'count'   => 1,
				),
			),
			$this->user_options->get( Dismissed_Prompts::OPTION ),
			'Removing a prompt dismissal should preserve other dismissed prompts.'
		);

		// If the prompt is not in dismissed prompts, there should be no change.
		$this->dismissed_prompts->remove( 'bar' );

		$this->assertEquals(
			array(
				'foo' => array(
					'expires' => 0,
					'count'   => 1,
				),
			),
			$this->user_options->get( Dismissed_Prompts::OPTION ),
			'Removing an unknown prompt dismissal should not change stored prompts.'
		);
	}
}
