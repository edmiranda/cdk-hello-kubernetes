import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class PipelineIac extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
				
        // Pipeline code goes here
        const pipeline = new CodePipeline(this, "ApplicationPipeline", {
			pipelineName: "ApplicationPipeline",
			synth: new CodeBuildStep("Synth", {
				input: CodePipelineSource.connection(
					"edmiranda/hello-kubernetes",
					"main",
					{ connectionArn: cdk.SecretValue.secretsManager("codestar-connection").toString()}
				),
				installCommands: ["npm install -g aws-cdk"],
				commands: ["docker version"]
			}),
			selfMutation: false
		});
    }
}