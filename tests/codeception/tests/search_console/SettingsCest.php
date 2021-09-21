<?php

class SettingsCest {

	public function _before( Search_ConsoleTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->loginAsAdmin();
		$I->connectSiteKit();
	}

	public function tryToTestSettings( Search_ConsoleTester $I ) {
		$I->amOnSettingsPage();
	}

}
