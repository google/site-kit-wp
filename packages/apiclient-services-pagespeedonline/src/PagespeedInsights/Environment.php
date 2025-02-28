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

namespace Google\Service\PagespeedInsights;

class Environment extends \Google\Model
{
  public $benchmarkIndex;
  /**
   * @var string[]
   */
  public $credits;
  /**
   * @var string
   */
  public $hostUserAgent;
  /**
   * @var string
   */
  public $networkUserAgent;

  public function setBenchmarkIndex($benchmarkIndex)
  {
    $this->benchmarkIndex = $benchmarkIndex;
  }
  public function getBenchmarkIndex()
  {
    return $this->benchmarkIndex;
  }
  /**
   * @param string[]
   */
  public function setCredits($credits)
  {
    $this->credits = $credits;
  }
  /**
   * @return string[]
   */
  public function getCredits()
  {
    return $this->credits;
  }
  /**
   * @param string
   */
  public function setHostUserAgent($hostUserAgent)
  {
    $this->hostUserAgent = $hostUserAgent;
  }
  /**
   * @return string
   */
  public function getHostUserAgent()
  {
    return $this->hostUserAgent;
  }
  /**
   * @param string
   */
  public function setNetworkUserAgent($networkUserAgent)
  {
    $this->networkUserAgent = $networkUserAgent;
  }
  /**
   * @return string
   */
  public function getNetworkUserAgent()
  {
    return $this->networkUserAgent;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Environment::class, 'Google_Service_PagespeedInsights_Environment');
