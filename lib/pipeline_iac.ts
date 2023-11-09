import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';

export class PipelineIac extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
		
		const account = props?.env?.account!;
        const region = props?.env?.region!;
		const codearn = ssm.StringParameter.valueFromLookup(this, 'CodeStarArn');
		
		const role = iam.Role.fromRoleArn(this, 'Role', `arn:aws:iam::${account}:role/cdk-iac-pipeline`, {
		  mutable: false,
		});
		
        // Pipeline code goes here
        const pipeline = new CodePipeline(this, "PipelineIac", {
			pipelineName: "PipelineIac",
			synth: new CodeBuildStep("Synth", {
				input: CodePipelineSource.connection(
					"edmiranda/cdk-hello-kubernetes",
					"main",
					{ connectionArn: codearn}
				),
                commands: [
                    'yarn install --frozen-lockfile',
 			        'yarn build',
			        'npx cdk synth',
                ],
                role: role
			}),
			selfMutation: false
		});
    }
}