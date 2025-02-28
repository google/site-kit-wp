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

class GoogleAnalyticsAdminV1betaDataStreamWebStreamData extends \Google\Model
{
  /**
   * @var string
   */
  public $defaultUri;
  /**
   * @var string
   */
  public $firebaseAppId;
  /**
   * @var string
   */
  public $measurementId;

  /**
   * @param string
   */
  public function setDefaultUri($defaultUri)
  {
    $this->defaultUri = $defaultUri;
  }
  /**
   * @return string
   */
  public function getDefaultUri()
  {
    return $this->defaultUri;
  }
  /**
   * @param string
   */
  public function setFirebaseAppId($firebaseAppId)
  {
    $this->firebaseAppId = $firebaseAppId;
  }
  /**
   * @return string
   */
  public function getFirebaseAppId()
  {
    return $this->firebaseAppId;
  }
  /**
   * @param string
   */
  public function setMeasurementId($measurementId)
  {
    $this->measurementId = $measurementId;
  }
  /**
   * @return string
   */
  public function getMeasurementId()
  {
    return $this->measurementId;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1betaDataStreamWebStreamData::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1betaDataStreamWebStreamData');
