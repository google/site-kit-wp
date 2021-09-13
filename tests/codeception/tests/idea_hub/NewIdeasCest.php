<?php

class NewIdeasCest {

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function checkNewIdeas( Idea_HubTester $I ) {
		$I->amOnDashboardPage();
	}

}
