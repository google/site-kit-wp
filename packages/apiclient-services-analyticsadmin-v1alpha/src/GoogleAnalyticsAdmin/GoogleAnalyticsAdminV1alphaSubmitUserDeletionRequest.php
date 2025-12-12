<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaSubmitUserDeletionRequest extends \Google\Model
{
  /**
   * @var string
   */
  public $appInstanceId;
  /**
   * @var string
   */
  public $clientId;
  /**
   * @var string
   */
  public $userId;
  /**
   * @var string
   */
  public $userProvidedData;

  /**
   * @param string
   */
  public function setAppInstanceId($appInstanceId)
  {
    $this->appInstanceId = $appInstanceId;
  }
  /**
   * @return string
   */
  public function getAppInstanceId()
  {
    return $this->appInstanceId;
  }
  /**
   * @param string
   */
  public function setClientId($clientId)
  {
    $this->clientId = $clientId;
  }
  /**
   * @return string
   */
  public function getClientId()
  {
    return $this->clientId;
  }
  /**
   * @param string
   */
  public function setUserId($userId)
  {
    $this->userId = $userId;
  }
  /**
   * @return string
   */
  public function getUserId()
  {
    return $this->userId;
  }
  /**
   * @param string
   */
  public function setUserProvidedData($userProvidedData)
  {
    $this->userProvidedData = $userProvidedData;
  }
  /**
   * @return string
   */
  public function getUserProvidedData()
  {
    return $this->userProvidedData;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaSubmitUserDeletionRequest::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaSubmitUserDeletionRequest');
