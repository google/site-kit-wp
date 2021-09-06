<?php

/**
 * Inherited Methods
 * @method void wantToTest($text)
 * @method void wantTo($text)
 * @method void execute($callable)
 * @method void expectTo($prediction)
 * @method void expect($prediction)
 * @method void amGoingTo($argumentation)
 * @method void am($role)
 * @method void lookForwardTo($achieveValue)
 * @method void comment($description)
 * @method void pause()
 *
 * @SuppressWarnings(PHPMD)
*/
class Search_ConsoleTester extends \Codeception\Actor {

	use _generated\Search_ConsoleTesterActions;

	/**
	 * Logs in with the provided credentials.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $login User login.
	 * @param string $password User password.
	 */
	public function login( $login, $password ) {
		$I = $this;
		$I->amOnPage( '/wp-login.php' );
		$I->submitForm(
			'#loginform',
			array(
				'log' => $login,
				'pwd' => $password,
			)
		);
		$I->see( $login, '.display-name' );
	}

	/**
	 * Activates provided plugins.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] ...$plugins Plugins list to activate.
	 */
	public function activatePlugins( ...$plugins ) {
		$I = $this;
		$I->amOnPage( '/wp-admin/plugins.php' );
		$I->submitForm(
			'#bulk-action-form',
			array(
				'action'  => 'activate-selected',
				'checked' => $plugins,
			)
		);
	}

	/**
	 * Deactivates provided plugins.
	 *
	 * @since n.e.x.t
	 *
	 * @param string[] ...$plugins Plugins list to deactivate.
	 */
	public function deactivatePlugins( ...$plugins ) {
		$I = $this;
		$I->amOnPage( '/wp-admin/plugins.php' );
		$I->submitForm(
			'#bulk-action-form',
			array(
				'action'  => 'deactivate-selected',
				'checked' => $plugins,
			)
		);
	}

}
