#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StackIaC } from '../lib/stack_iac';
import { PipelineIac } from '../lib/pipeline_iac';
import { PipelineApplication } from '../lib/pipeline_application';
const app = new cdk.App();

const env  = {
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION
};

new StackIaC(app, 'StackIaC', {env: env});
new PipelineIac(app, 'PipelineIac', {env: env});
new PipelineApplication(app, 'PipelineApplication', {env: env});